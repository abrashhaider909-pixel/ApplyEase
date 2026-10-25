/**
 * Official document PDF renderer (vector)
 * ---------------------------------------------------------------------------
 * Draws the order directly with jsPDF instead of screenshotting the DOM.
 * That fixes the html2canvas failure on Tailwind v4 colours (`oklch`), keeps
 * the text selectable, and lets us place exactly as many signature blocks as
 * were actually applied, plus the department seals and a verification QR.
 */

import { Application, OfficialDocumentTemplate } from '../types';
import { renderDocumentText } from './pdfGenerator';

interface RenderOptions {
  /** Preview mode draws placeholder signatories from the template slots. */
  preview?: boolean;
  verificationUrl?: string;
}

const A4 = { width: 210, height: 297 };
/** Bump when the layout changes so stored PDFs are regenerated. */
export const PDF_RENDER_VERSION = 2;
const MARGIN = 18;

function toDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

/** Rasterise and downscale an SVG/data URL so jsPDF can embed it cheaply. */
async function toPngDataUrl(src: string | undefined, targetWidth = 600): Promise<string | null> {
  if (!src) return null;

  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('image load failed'));
      image.src = src;
    });

    // Always redraw at a modest size: full-resolution scans can turn a one-page
    // order into a multi-megabyte download.
    const width = Math.min(targetWidth, image.width || targetWidth);
    const ratio = image.height && image.width ? image.height / image.width : 0.45;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(40, Math.round(width * ratio));
    const context = canvas.getContext('2d');
    if (!context) return null;
    // Flatten onto white paper; JPEG keeps a signed page a few hundred KB
    // instead of several megabytes.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

export async function buildOfficialDocumentPdf(
  application: Application,
  template?: OfficialDocumentTemplate,
  options: RenderOptions = {}
): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf');
    const landscape = template?.orientation === 'landscape';
    const pdf = new jsPDF({
      orientation: landscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGIN * 2;
    let y = 22;

    /* ---------------------------------------------------------------- header */
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(23, 43, 80);
    pdf.text('APEX STATE UNIVERSITY', pageWidth / 2, y, { align: 'center' });
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(110);
    pdf.text((template?.headerNotice || 'OFFICE OF THE REGISTRAR').replace(/[·|]/g, '-'), pageWidth / 2, y, {
      align: 'center'
    });
    pdf.setTextColor(0);
    y += 4;

    pdf.setDrawColor(23, 43, 80);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 13;

    /* ----------------------------------------------------------------- title */
    const title = template
      ? renderDocumentText(template.title, application)
      : `${application.applicationTypeTitle.toUpperCase()} — OFFICIAL ORDER`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    const titleLines = pdf.splitTextToSize(title, contentWidth) as string[];
    pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 6 + 8;

    /* ------------------------------------------------------------------ meta */
    const issued = application.issuedDocument;
    const issuedOn = new Date(issued?.generatedAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    [
      `Reference: ${application.referenceNumber}`,
      `Document No: ${issued?.documentNumber || '—'}`,
      `Issued to: ${application.studentSnapshot.name} (${application.studentSnapshot.registrationNumber})`,
      `Department: ${application.studentSnapshot.department}`,
      `Date of issue: ${issuedOn}`
    ].forEach(line => {
      pdf.text(line, MARGIN, y);
      y += 5;
    });
    pdf.setTextColor(0);
    y += 5;

    /* ------------------------------------------------------------------ body */
    pdf.setFontSize(10);
    pdf.setTextColor(30);
    const paragraphs = template?.bodyParagraphs?.length
      ? template.bodyParagraphs
      : [
          `This is to certify that ${application.studentSnapshot.name} has been granted the ${application.applicationTypeTitle.toLowerCase()} recorded under reference ${application.referenceNumber}.`,
          'This order is issued electronically and may be verified against the university registry using the QR code and verification code below.'
        ];

    paragraphs.forEach(paragraph => {
      const text = renderDocumentText(paragraph, application);
      const lines = pdf.splitTextToSize(text, contentWidth) as string[];
      if (y + lines.length * 5 > pageHeight - 105) {
        pdf.addPage();
        y = 24;
      }
      pdf.text(lines, MARGIN, y);
      y += lines.length * 5 + 4;
    });

    /* ------------------------------------------------- signatures & seals */
    const appliedSignatures = issued?.appliedSignatures || [];
    const appliedStamps = issued?.appliedStamps || [];

    type Signatory = { name: string; role: string; date: string; imageUrl?: string };
    let signatories: Signatory[] = appliedSignatures.map(signature => ({
      name: signature.staffName,
      role: signature.roleTitle,
      date: new Date(signature.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: signature.signatureUrl
    }));

    if (signatories.length === 0 && template?.signatureSlots?.length) {
      signatories = template.signatureSlots.map((slot, index) => ({
        name: options.preview ? `Signatory ${index + 1}` : slot.roleTitle,
        role: slot.roleTitle,
        date: issuedOn,
        imageUrl: undefined
      }));
    }

    if (signatories.length === 0 && !options.preview) {
      signatories = [{ name: 'Authorised Officer', role: 'Office of the Registrar', date: issuedOn }];
    }

    const signatureTop = Math.max(y + 8, pageHeight - 84);
    const perRow = Math.min(signatories.length, 3) || 1;
    const blockWidth = contentWidth / perRow;
    const signatureHeight = 26;

    for (let index = 0; index < signatories.length; index += 1) {
      const row = Math.floor(index / 3);
      const column = index % 3;
      const x = MARGIN + column * blockWidth;
      const blockTop = signatureTop + row * signatureHeight;
      const signatory = signatories[index];

      if (signatory.imageUrl) {
        const png = await toPngDataUrl(signatory.imageUrl, 420);
        if (png) {
          try {
            pdf.addImage(png, png.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', x + 2, blockTop - 3, 34, 14);
          } catch {
            /* fall back to a signature line only */
          }
        }
      }

      pdf.setDrawColor(90);
      pdf.setLineWidth(0.3);
      pdf.line(x, blockTop + 13, x + blockWidth - 10, blockTop + 13);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(20);
      pdf.text(signatory.name, x, blockTop + 17.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(90);
      pdf.text(signatory.role, x, blockTop + 21);
      pdf.text(signatory.date, x, blockTop + 24.5);
    }

    // Seals sit under the signatures, one per applied stamp.
    let stampX = MARGIN;
    const stampTop = pageHeight - 52;
    for (const stamp of appliedStamps) {
      const png = await toPngDataUrl(stamp.stampUrl, 320);
      if (png) {
        try {
          pdf.addImage(png, png.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', stampX, stampTop - 20, 22, 22);
        } catch {
          /* skip unreadable seal */
        }
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(110);
      pdf.text(stamp.stampName, stampX, stampTop + 4);
      stampX += 30;
    }

    /* ------------------------------------------------------------------- QR */
    const verificationCode = issued?.verificationCode || 'PREVIEW';
    const verificationUrl =
      options.verificationUrl ||
      `${typeof window !== 'undefined' ? window.location.origin : 'https://applyease.app'}/#verify=${encodeURIComponent(verificationCode)}`;

    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 240, errorCorrectionLevel: 'M' });
      const qrSize = 24;
      const qrX = pageWidth - MARGIN - qrSize;
      const qrY = pageHeight - 52;
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      pdf.setFontSize(6.5);
      pdf.setTextColor(90);
      pdf.text('Scan to verify', qrX, qrY + qrSize + 3);
    } catch {
      /* QR is optional; never block issuance on it */
    }

    /* --------------------------------------------------------------- footer */
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, pageHeight - 22, pageWidth - MARGIN, pageHeight - 22);
    pdf.setFontSize(7);
    pdf.setTextColor(110);
    pdf.text(`Verification code: ${verificationCode}`, MARGIN, pageHeight - 17);
    if (issued?.documentHash) {
      pdf.text(`SHA-256: ${issued.documentHash.slice(0, 56)}…`, MARGIN, pageHeight - 13);
    }
    if (template?.footerNotice) {
      pdf.text(renderDocumentText(template.footerNotice, application).slice(0, 110), MARGIN, pageHeight - 9);
    }

    return toDataUrl(pdf.output('arraybuffer'));
  } catch (error) {
    console.warn('[ApplyEase] PDF render failed:', error);
    return null;
  }
}

/** Backwards-compatible alias used by the issuance pipeline. */
export const buildIssuedDocumentPdf = buildOfficialDocumentPdf;
