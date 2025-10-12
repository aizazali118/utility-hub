import React, { useState, useRef } from 'react';
import { Download, Copy, Check, Upload, X } from 'lucide-react';
import * as QRCode from 'qrcode';

const QRGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [autoDetectLogo, setAutoDetectLogo] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const detectLogoFromURL = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      if (domain.includes('whatsapp')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
      } else if (domain.includes('facebook') || domain.includes('fb.com')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg';
      } else if (domain.includes('twitter') || domain.includes('x.com')) {
        return 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png';
      } else if (domain.includes('instagram')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png';
      } else if (domain.includes('linkedin')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png';
      } else if (domain.includes('youtube')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
      } else if (domain.includes('github')) {
        return 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
      } else {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    } catch (error) {
      return null;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAutoDetectLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const addLogoToQR = async (qrCanvas: HTMLCanvasElement, logoSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = qrCanvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const logo = new Image();
      logo.crossOrigin = 'anonymous';

      logo.onload = () => {
        const logoSize = qrCanvas.width * 0.2;
        const logoX = (qrCanvas.width - logoSize) / 2;
        const logoY = (qrCanvas.height - logoSize) / 2;

        ctx.fillStyle = 'white';
        ctx.fillRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        resolve();
      };

      logo.onerror = () => {
        console.warn('Failed to load logo, proceeding without it');
        resolve();
      };

      logo.src = logoSrc;
    });
  };

  const generateQR = async () => {
    if (!text.trim()) return;

    try {
      const tempCanvas = document.createElement('canvas');

      await QRCode.toCanvas(tempCanvas, text, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      let logoSource = '';
      if (logoPreview) {
        logoSource = logoPreview;
      } else if (autoDetectLogo) {
        const detectedLogo = detectLogoFromURL(text);
        if (detectedLogo) {
          logoSource = detectedLogo;
        }
      }

      if (logoSource) {
        await addLogoToQR(tempCanvas, logoSource);
      }

      const finalQrUrl = tempCanvas.toDataURL('image/png');
      setQrCodeUrl(finalQrUrl);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = size;
          canvas.height = size;
          ctx?.drawImage(img, 0, 0, size, size);
        };
        img.src = finalQrUrl;
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
            <p className="text-gray-600">Generate custom QR codes with logos for any text or URL</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Options
                  </label>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDetectLogo}
                        onChange={(e) => {
                          setAutoDetectLogo(e.target.checked);
                          if (e.target.checked) {
                            removeLogo();
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Auto-detect logo from URL</span>
                    </label>

                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-500 mb-2">Or upload a custom logo:</p>

                      {logoPreview ? (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-contain" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Custom logo uploaded</p>
                          </div>
                          <button
                            onClick={removeLogo}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                            disabled={autoDetectLogo}
                          />
                          <label
                            htmlFor="logo-upload"
                            className={`inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-all ${
                              autoDetectLogo
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload Logo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateQR}
                  disabled={!text.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  Generate QR Code
                </button>
              </div>
            </div>

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
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300"
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

          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Auto Logo Detection</p>
                  <p className="text-gray-600">Automatically detects logos for popular platforms like WhatsApp, Facebook, Instagram, etc.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Custom Logos</p>
                  <p className="text-gray-600">Upload your own logo to customize your QR code</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">High Quality</p>
                  <p className="text-gray-600">Generate QR codes with error correction for better scanning</p>
                </div>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
