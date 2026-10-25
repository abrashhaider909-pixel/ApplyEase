import React, { useEffect, useState } from 'react';

interface VerificationQrProps {
  code: string;
  size?: number;
  className?: string;
}

/**
 * Real, scannable verification QR.
 * Encodes a deep link back into the app (`/#verify=CODE`) so a phone camera
 * opens the public verification screen with the code already resolved.
 */
export const VerificationQr: React.FC<VerificationQrProps> = ({ code, size = 96, className }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const dataUrl = await QRCode.toDataURL(`${origin}/#verify=${encodeURIComponent(code)}`, {
          margin: 1,
          width: 240,
          errorCorrectionLevel: 'M',
          color: { dark: '#172b50', light: '#ffffff' }
        });
        if (!cancelled) setSrc(dataUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!src) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={`Verification QR code for ${code}`}
      className={className}
    />
  );
};
