/**
 * Frontend file security validator.
 * Checks extension, MIME type, and magic bytes (file signature).
 * Blocks anything that doesn't match known-safe formats.
 */

const ALLOWED_EXTENSIONS = ["pdf", "xlsx", "xls", "csv", "jpg", "jpeg", "png"];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "text/plain", // some systems report csv as text/plain
  "image/jpeg",
  "image/png",
];

/**
 * Magic byte signatures for each allowed format.
 * Each entry: { bytes: number[], offset: number }
 */
const MAGIC_SIGNATURES: { ext: string; offset: number; bytes: number[] }[] = [
  // PDF: %PDF
  { ext: "pdf", offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
  // PNG: \x89PNG
  { ext: "png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  // JPEG: FF D8 FF
  { ext: "jpg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  // ZIP-based (xlsx): PK\x03\x04
  { ext: "xlsx", offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
  // XLS (OLE2): D0 CF 11 E0
  { ext: "xls", offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] },
];

const readMagicBytes = (file: File, length: number): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target?.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, length));
  });

const matchesMagic = (bytes: Uint8Array, sig: { offset: number; bytes: number[] }) =>
  sig.bytes.every((b, i) => bytes[sig.offset + i] === b);

export interface SecurityCheckResult {
  safe: boolean;
  reason?: string;
}

export const validateFileUpload = async (file: File): Promise<SecurityCheckResult> => {
  // 1. Extension check
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      safe: false,
      reason: `File type ".${ext}" is not allowed. Accepted: PDF, Excel, CSV, JPG, PNG.`,
    };
  }

  // 2. MIME type check (skip for CSV since MIME varies)
  if (ext !== "csv" && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      safe: false,
      reason: `Invalid file MIME type "${file.type}". The file may be disguised.`,
    };
  }

  // 3. Magic bytes check (skip for CSV — it's plain text, no signature)
  if (ext !== "csv") {
    const bytes = await readMagicBytes(file, 8);
    const extToCheck = ext === "jpeg" ? "jpg" : ext;
    const sigs = MAGIC_SIGNATURES.filter((s) => s.ext === extToCheck);

    // If we have signatures for this type, at least one must match
    if (sigs.length > 0 && !sigs.some((sig) => matchesMagic(bytes, sig))) {
      return {
        safe: false,
        reason: `File content does not match its extension. Possible malicious file detected.`,
      };
    }
  }

  // 4. CSV content sanity check — block formula injection
  if (ext === "csv") {
    const text = await file.text();
    const lines = text.split("\n").slice(0, 20); // check first 20 lines
    const formulaPattern = /^[=+\-@|]/;
    const suspicious = lines.some((line) =>
      line.split(",").some((cell) => formulaPattern.test(cell.trim())),
    );
    if (suspicious) {
      return {
        safe: false,
        reason: `CSV contains potentially malicious formula injection characters (=, +, -, @).`,
      };
    }
  }

  return { safe: true };
};
