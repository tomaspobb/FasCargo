// ↓↓↓ añade/actualiza esto dentro de src/lib/extractInvoice.ts

async function loadPdfjs(): Promise<any> {
  // intentamos varias rutas según versión
  const candidates = [
    // v3 (ESM)
    'pdfjs-dist/build/pdf.mjs',
    // algunos builds legacy
    'pdfjs-dist/legacy/build/pdf.mjs',
    'pdfjs-dist/legacy/build/pdf.js',
    // fallback clásico (no siempre presente)
    'pdfjs-dist/build/pdf.js',
  ];
  let lastErr: any;
  for (const path of candidates) {
    try {
      const mod: any = await import(/* @vite-ignore */ path);
      if (mod && (mod.getDocument || mod.default?.getDocument)) {
        return mod.getDocument ? mod : mod.default;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `No pude cargar pdfjs-dist. Verifica que esté instalado (npm i pdfjs-dist@^3). Último error: ${
      (lastErr && (lastErr as Error).message) || lastErr
    }`
  );
}

async function extractTextWithPdfjs(buffer: Buffer | Uint8Array): Promise<string> {
  const pdfjsLib = await loadPdfjs();
  const docTask = pdfjsLib.getDocument({ data: buffer, isEvalSupported: false });
  const doc = await docTask.promise;

  let parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const pageText = (content.items as any[])
      .map((it) => (typeof it.str === 'string' ? it.str : ''))
      .join('\n');
    parts.push(pageText);
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
