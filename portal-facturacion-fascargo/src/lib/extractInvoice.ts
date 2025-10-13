// src/lib/extractInvoice.ts
import 'server-only';

// ---------- helpers ----------
type ExtractedForIPdf = {
  folio?: string;
  proveedor?: string;
  fechaEmision?: Date;
  neto?: number;
  iva?: number;
  total?: number;
};
export type { ExtractedForIPdf };

function normalizeSpaces(s: string) {
  return s
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function toNumberMoney(input?: string) {
  if (!input) return undefined;
  const clean = input
    .replace(/[^\d,.\-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
}

function toDateMaybe(s?: string): Date | undefined {
  if (!s) return undefined;
  const m1 = s.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚñ]+)\s+(?:del?\s+)?(\d{4})/i);
  if (m1) {
    const d = +m1[1];
    const y = +m1[3];
    const months: Record<string, number> = {
      enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
      julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
    };
    const mo = months[m1[2].toLowerCase()] || 0;
    if (mo) {
      const dt = new Date(y, mo - 1, d);
      return isNaN(dt.getTime()) ? undefined : dt;
    }
  }
  const m2 = s.match(/([0-3]?\d)[\/\-\.]([01]?\d)[\/\-\.](\d{2,4})/);
  if (m2) {
    const d = +m2[1], mo = +m2[2]; let y = +m2[3];
    if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? undefined : dt;
  }
  return undefined;
}

function lastMatch(regexes: RegExp[], text: string): string | undefined {
  for (const re0 of regexes) {
    const re = new RegExp(re0.source, re0.flags.includes('g') ? re0.flags : re0.flags + 'g');
    let m: RegExpMatchArray | null, last: RegExpMatchArray | null = null;
    while ((m = re.exec(text)) !== null) last = m;
    if (last?.[1]) return last[1].trim();
  }
  return undefined;
}

// ---------- extracción real de texto con pdfjs ----------
async function extractTextWithPdfjs(buffer: Buffer | Uint8Array): Promise<string> {
  // usamos el build legacy ESM que funciona en Node
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // en Node no hace falta worker
  const docTask = pdfjsLib.getDocument({ data: buffer, isEvalSupported: false });
  const doc = await docTask.promise;

  let parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const text = (content.items as any[])
      .map((it) => (typeof it.str === 'string' ? it.str : ''))
      .join('\n'); // mantener saltos para mejorar patrones tipo "Fecha Emisión: ..."
    parts.push(text);
    page.cleanup?.();
  }
  await doc.cleanup?.();
  return normalizeSpaces(parts.join('\n'));
}

// ---------- extractor principal ----------
export async function extractInvoiceForIPdf(
  buffer: Buffer | Uint8Array
): Promise<ExtractedForIPdf> {
  const text = await extractTextWithPdfjs(buffer);

  // console.log('[PDF TEXT]', text.slice(0, 1500));

  // Proveedor (antes de RUT o antes de FACTURA ELECTRONICA)
  const proveedor =
    text.match(/([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+R\.?U\.?T\.?/i)?.[1]?.trim() ??
    text.match(/([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+FACTURA\s+ELECTRONICA/i)?.[1]?.trim() ??
    text.match(/(?:raz[oó]n\s+social|emisor|proveedor)\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim();

  // Folio
  const folio =
    text.match(/FACTURA\s+ELECTRONICA\s*(?:N[°º#]\s*|No\.?\s*)?([0-9]{1,10})/i)?.[1]?.trim() ??
    text.match(/\bN[°º#]\s*([0-9]{1,10})\b/i)?.[1]?.trim() ??
    text.match(/\bNo\.?\s*([0-9]{1,10})\b/i)?.[1]?.trim();

  // Fecha de emisión
  const fechaStr =
    text.match(/Fecha\s*Emisi[oó]n\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim() ??
    text.match(/\bEmisi[oó]n\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim() ??
    text.match(/Fecha\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim();
  const fechaEmision = toDateMaybe(fechaStr);

  // Montos (último match)
  const netoStr = lastMatch(
    [/MONTO\s+NETO\s*[$:]?\s*([0-9\.\,]+)/i, /\bNETO\s*[$:]?\s*([0-9\.\,]+)/i, /\bSUBTOTAL\s*[$:]?\s*([0-9\.\,]+)/i],
    text
  );
  const ivaStr = lastMatch(
    [/I\.?V\.?A\.?(?:\s*\d{1,2}%|)\s*[$:]?\s*([0-9\.\,]+)/i, /IMPUESTO\s*(?:ADICIONAL|IVA)\s*[$:]?\s*([0-9\.\,]+)/i],
    text
  );
  const totalStr = lastMatch(
    [/TOTAL\s*(?:FACTURA|A\s*PAGAR|GENERAL|)\s*[$:]?\s*([0-9\.\,]+)/i, /MONTO\s*TOTAL\s*[$:]?\s*([0-9\.\,]+)/i],
    text
  );

  return {
    folio,
    proveedor,
    fechaEmision,
    neto: toNumberMoney(netoStr),
    iva: toNumberMoney(ivaStr),
    total: toNumberMoney(totalStr),
  };
}
