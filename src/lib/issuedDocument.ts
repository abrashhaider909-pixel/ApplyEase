/**
 * Compatibility shim — the vector renderer lives in `officialPdf.ts`.
 * Kept so the issuance pipeline and older imports keep working.
 */
export { buildOfficialDocumentPdf, buildIssuedDocumentPdf } from './officialPdf';
