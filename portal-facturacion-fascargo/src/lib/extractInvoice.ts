import 'server-only';
import * as pdfjsLib from 'pdfjs-dist';
import path from 'path';

// ---- helpers ----
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
  const m = s.match(/([0-3]?\d)[\/\-.]([01]?\d)[\/\-.](\d{2,4})/);
  if (!m) return undefined;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  const dt = new Date(y, mo - 1, d);
  return isNaN(dt.getTime()) ? undefined : dt;
}

export type ExtractedForIPdf = {
  folio?: string;
  proveedor?: string;
  fechaEmision?: Date;
  neto?: number;
  iva?: number;
  total?: number;
};

export async function extractInvoiceForIPdf(
  buffer: Buffer | Uint8Array
): Promise<ExtractedForIPdf> {
  try {
    // Configurar el worker de pdfjs para Node.js
    // Usar el archivo compilado dentro de node_modules
    const workerPath = path.join(
      require.resolve('pdfjs-dist/package.json'),
      '../build/pdf.worker.js'
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

    // Convertir Buffer a Uint8Array si es necesario
    const uint8Array = buffer instanceof Buffer 
      ? new Uint8Array(buffer) 
      : buffer;

    // Parsear el PDF
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    let text = '';

    // Extraer texto de todas las páginas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    // Función auxiliar para extraer con regex
    const grab = (re: RegExp) => text.match(re)?.[1]?.trim();

    // ===== Regex afinadas para facturas chilenas (SII) =====
    const proveedor =
      grab(
        /([A-ZÁÉÍÓÚÑ0-9\.\-&\s]{3,})\s*(?:R\.?U\.?T\.?|FACTURA\s+ELECTRONICA)/i
      ) ||
      grab(/(?:raz[oó]n\s+social|emisor|proveedor)\s*[:\-]\s*([^\n]+)/i);

    const folio =
      grab(/FACTURA\s+ELECTRONICA\s*(?:N[°º#]\s*|)\s*([0-9]{1,8})/i) ||
      grab(/N[°º#]\s*([0-9]{1,8})/i);

    const fechaEmision = toDateMaybe(
      grab(
        /Fecha\s*Emisi[oó]n\s*[:\-]\s*([0-9]{1,2}\s+de\s+[A-Za-zÁÉÍÓÚñ]+\s+(?:del?\s+)?\d{4})/i
      ) ||
        grab(
          /Fecha\s*Emisi[oó]n\s*[:\-]\s*([0-3]?\d[\/\-\.\s][01]?\d[\/\-\.\s]\d{2,4})/i
        )
    );

    const neto =
      toNumberMoney(grab(/MONTO\s+NETO\s*[$:]?\s*([0-9\.\,]+)/i)) ||
      toNumberMoney(grab(/NETO\s*[$:]?\s*([0-9\.\,]+)/i));

    const iva =
      toNumberMoney(grab(/I\.?V\.?A\.?\s*(?:19%|)\s*[$:]?\s*([0-9\.\,]+)/i)) ||
      toNumberMoney(
        grab(/IMPUESTO\s*(?:ADICIONAL|IVA)\s*[$:]?\s*([0-9\.\,]+)/i)
      );

    const total =
      toNumberMoney(
        grab(
          /TOTAL\s*(?:FACTURA|A\s*PAGAR|GENERAL|)\s*[$:]?\s*([0-9\.\,]+)/i
        )
      ) ||
      toNumberMoney(grab(/MONTO\s*TOTAL\s*[$:]?\s*([0-9\.\,]+)/i));

    return { folio, proveedor, fechaEmision, neto, iva, total };
  } catch (error) {
    console.error('Error extrayendo factura:', error);
    throw new Error(
      `Error procesando PDF: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
}