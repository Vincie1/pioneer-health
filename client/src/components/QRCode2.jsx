import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

// Renders `value` as a QR code onto a canvas. Used on the mobile ticket so the
// patient can present it at the kiosk "Check in" screen.
export function QRCode2({ value, size = 180 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(() => {});
  }, [value, size]);

  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
}
