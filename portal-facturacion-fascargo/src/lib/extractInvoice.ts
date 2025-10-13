import 'server-only';

export type ExtractedForIPdf = {
  folio?: string;
  proveedor?: string;
  fechaEmision?: Date;
  neto?: number;
  iva?: number;
  total?: number;
};

// ------------------ helpers ------------------
function toNumberMoney(input?: string) {
  if (!input) return undefined;
  const clean = input
    .replace(/[^\d,.\-]/g, '')                 // deja dígitos y separadores
    .replace(/\.(?=\d{3}(\D|$))/g, '')         // quita puntos de miles
    .replace(',', '.');                        // coma decimal -> punto
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
}

function toDateMaybe(s?: string): Date | undefined {
  if (!s) return undefined;

  // 11 de Septiembre del 2024
  const m1 = s.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚñ]+)\s+(?:del?\s+)?(\d{4})/i);
  if (m1) {
    const d = parseInt(m1[1], 10);
    const monthStr = m1[2].toLowerCase();
    const y = parseInt(m1[3], 10);
    const months: Record<string, number> = {
      enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
      julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
    };
    const mo = months[monthStr] || 0;
    if (mo > 0) {
      const dt = new Date(y, mo - 1, d);
      return isNaN(dt.getTime()) ? undefined : dt;
    }
  }

  // 11-09-2024 / 11/09/2024
  const m2 = s.match(/([0-3]?\d)[\/\-\.]([01]?\d)[\/\-\.](\d{2,4})/);
  if (m2) {
    const d = parseInt(m2[1], 10);
    const mo = parseInt(m2[2], 10);
    let y = parseInt(m2[3], 10);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? undefined : dt;
  }
  return undefined;
}

function lastMatch(regex: RegExp, text: string): RegExpMatchArray | null {
  let m: RegExpMatchArray | null;
  let last: RegExpMatchArray | null = null;
  const r = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = r.exec(text)) !== null) last = m;
  return last;
}

function normalizeSpaces(s: string) {
  return s
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// ------------------ tu extractor de texto ------------------
// (deja tu extractTextFromPdfBuffer como ya lo tienes)

// ------------------ extractor principal ------------------
export async function extractInvoiceForIPdf(
  buffer: Buffer | Uint8Array
): Promise<ExtractedForIPdf> {
  // Usa tu extractor ligero
  const raw = extractTextFromPdfBuffer(buffer);
  const text = normalizeSpaces(raw);

  // console.log('=== DEBUG TEXT ===\n', text.slice(0, 2000));

  const grab1 = (regexes: RegExp[]): string | undefined => {
    for (const re of regexes) {
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return undefined;
  };

  const grabLastNumber = (regexes: RegExp[]): number | undefined => {
    for (const re of regexes) {
      const m = lastMatch(re, text);
      if (m?.[1]) {
        const n = toNumberMoney(m[1]);
        if (typeof n === 'number') return n;
      }
    }
    return undefined;
  };

  // Proveedor: antes de RUT o antes de "FACTURA ELECTRONICA"
  const proveedor =
    grab1([
      /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+R\.?U\.?T\.?/i,
      /([A-ZÁÉÍÓÚÑ0-9\.\-& ]{3,})\s+FACTURA\s+ELECTRONICA/i,
      /(?:raz[oó]n\s+social|emisor|proveedor)\s*[:\-]\s*([^\n]+)/i,
    ]);

  // Folio (N°, Nº, No, #) o después de "Factura Electrónica"
  const folio =
    grab1([
      /FACTURA\s+ELECTRONICA\s*(?:N[°º#]\s*|No\.?\s*)?([0-9]{1,10})/i,
      /\bN[°º#]\s*([0-9]{1,10})\b/i,
      /\bNo\.?\s*([0-9]{1,10})\b/i,
    ]);

  // Fecha de emisión
  const fechaStr =
    grab1([
      /Fecha\s*Emisi[oó]n\s*[:\-]\s*([^\n]+)/i,
      /\bEmisi[oó]n\s*[:\-]\s*([^\n]+)/i,
      /Fecha\s*[:\-]\s*([^\n]+)/i,
    ]);
  const fechaEmision = toDateMaybe(fechaStr);

  // Montos: tomar el ÚLTIMO match (suele ser el cuadro de totales)
  const neto = grabLastNumber([
    /MONTO\s+NETO\s*[$:]?\s*([0-9\.\,]+)/i,
    /\bNETO\s*[$:]?\s*([0-9\.\,]+)/i,
    /\bSUBTOTAL\s*[$:]?\s*([0-9\.\,]+)/i,
  ]);

  const iva = grabLastNumber([
    /I\.?V\.?A\.?(?:\s*\d{1,2}%|)\s*[$:]?\s*([0-9\.\,]+)/i,
    /IMPUESTO\s*(?:ADICIONAL|IVA)\s*[$:]?\s*([0-9\.\,]+)/i,
  ]);

  const total = grabLastNumber([
    /TOTAL\s*(?:FACTURA|A\s*PAGAR|GENERAL|)\s*[$:]?\s*([0-9\.\,]+)/i,
    /MONTO\s*TOTAL\s*[$:]?\s*([0-9\.\,]+)/i,
  ]);

  return { folio, proveedor, fechaEmision, neto, iva, total };
}
