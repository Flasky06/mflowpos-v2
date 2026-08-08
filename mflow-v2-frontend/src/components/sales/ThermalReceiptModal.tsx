import React, { useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  receiptPayload: string;
}

export const ThermalReceiptModal: React.FC<Props> = ({ isOpen, onClose, receiptPayload }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handlePrint = () => {
    if (!receiptPayload) return;

    // Use an invisible iframe for reliable thermal printing across browsers
    let iframe = iframeRef.current;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt Print</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                white-space: pre-wrap;
                word-break: break-all;
                margin: 0;
                padding: 8px;
                width: 78mm;
                font-size: 12px;
                line-height: 1.3;
                color: #000;
                background: #fff;
              }
            </style>
          </head>
          <body>${receiptPayload}</body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 250);
    }
  };

  useEffect(() => {
    if (isOpen && receiptPayload) {
      // Auto trigger thermal print dialog on open
      handlePrint();
    }
  }, [isOpen, receiptPayload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl text-slate-900 border border-slate-200 relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-lg text-slate-900">Thermal Receipt Preview</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatted Monospace Preview Box */}
        <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-mono text-xs text-slate-900 overflow-x-auto whitespace-pre leading-relaxed mb-6 max-h-80 select-all shadow-inner border-slate-300">
          {receiptPayload}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md active:scale-98"
          >
            <Printer className="w-4 h-4" />
            Print Receipt Now
          </button>
        </div>
      </div>
    </div>
  );
};
