/**
 * Browser download helper.
 * Chrome/Firefox can silently refuse `data:` URL downloads (especially large
 * ones), so convert to a Blob URL first and revoke it afterwards.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const fallback = () => {
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  };

  try {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) {
      fallback();
      return;
    }
    const meta = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    const mime = /data:([^;]+)/.exec(meta)?.[1] || 'application/octet-stream';

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch {
    fallback();
  }
}
