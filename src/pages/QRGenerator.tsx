import React, { useState, useRef } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import * as QRCode from 'qrcode';

const QRGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    if (!text.trim()) return;

    try {
      // Generate QR code as data URL first
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrDataUrl);
      
      // Also draw on canvas for consistency
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = size;
          canvas.height = size;
          ctx?.drawImage(img, 0, 0, size, size);
        };
        img.src = qrDataUrl;
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error generating QR code. Please try again.');
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const copyToClipboard = async () => {
    if (qrCodeUrl) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">QR Code Generator</h1>
            <p className="text-gray-600">Generate custom QR codes for any text or URL</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Generator Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text or URL
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text or URL to generate QR code..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size: {size}x{size}px
                  </label>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>128px</span>
                    <span>512px</span>
                  </div>
                </div>

                <button
                  onClick={generateQR}
                  disabled={!text.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate QR Code
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Preview</h2>
              
              <div className="text-center">
                {qrCodeUrl ? (
                  <div className="space-y-6">
                    <div className="inline-block p-4 bg-gray-50 rounded-2xl shadow-inner">
                      <img 
                        src={qrCodeUrl} 
                        alt="Generated QR Code"
                        className="max-w-full h-auto rounded-lg"
                        style={{ width: size, height: size }}
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={downloadQR}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                      
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-gray-400">
                    <div className="w-32 h-32 mx-auto mb-4 border-4 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">📱</span>
                    </div>
                    <p>Your QR code will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;