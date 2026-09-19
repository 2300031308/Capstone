/*
 * Product QR Code Component
 * Generates an offline cryptographic verification QR code using the established "qrcode" library.
 *
 * Security Guarantee:
 * - Encodes ONLY safe public reference (productId / safe application verification route).
 * - ZERO secrets, private keys, Fabric credentials, or network configuration.
 */

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Check } from 'lucide-react';

export default function ProductQRCode({ productId, size = 140, showDownload = false }) {
  const canvasRef = useRef(null);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !productId) return;

    // Encode strictly the safe public identifier
    const qrValue = String(productId).trim();

    QRCode.toCanvas(
      canvasRef.current,
      qrValue,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          console.error('[ProductQRCode] QR generation error:', err);
          setError('Failed to render QR');
        } else {
          setError(null);
        }
      }
    );
  }, [productId, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `product-qr-${productId}.png`;
    a.href = url;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          padding: '8px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}

      {showDownload && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleDownload}
          style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {downloaded ? <Check size={12} color="var(--success)" /> : <Download size={12} />}
          <span>{downloaded ? 'Saved' : 'Download QR'}</span>
        </button>
      )}
    </div>
  );
}
