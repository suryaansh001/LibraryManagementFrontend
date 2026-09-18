'use client'

import { useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerIdRef = useRef('qr-reader');

  const startScanning = useCallback(async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerIdRef.current);
      }
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          setScanning(false);
          setCameraActive(false);
          try { scannerRef.current?.stop(); } catch {}
          onScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
      setScanning(true);
    } catch (err: unknown) {
      if (onError) onError(err instanceof Error ? err.message : 'Camera unavailable');
      setCameraActive(false);
    }
  }, [onScan, onError]);

  const stopScanning = useCallback(async () => {
    try {
      await scannerRef.current?.stop();
    } catch {}
    setScanning(false);
    setCameraActive(false);
  }, []);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div><h3 className="font-semibold">QR Scanner</h3><p className="mt-1 text-xs text-muted-foreground">Point camera at a student QR code</p></div>
        <QrCode className="size-5 text-indigo-600" />
      </div>
      <div id={scannerIdRef.current} className="flex aspect-square max-h-80 items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 overflow-hidden" />
      {!cameraActive && (
        <button onClick={startScanning} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <Camera className="size-4" />{scanning ? 'Opening camera...' : 'Start camera scan'}
        </button>
      )}
      {cameraActive && (
        <button onClick={stopScanning} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700">
          <X className="size-4" />Stop scanning
        </button>
      )}
    </div>
  );
}