import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Settings, Zap } from 'lucide-react';

interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

const ImageResizer: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [newWidth, setNewWidth] = useState<number>(0);
  const [newHeight, setNewHeight] = useState<number>(0);
  const [quality, setQuality] = useState<number>(90);
  const [outputFormat, setOutputFormat] = useState<string>('jpeg');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      setImageData({
        file,
        url,
        width: img.width,
        height: img.height
      });
      setNewWidth(img.width);
      setNewHeight(img.height);
    };
    
    img.src = url;
  };

  const handleWidthChange = (width: number) => {
    setNewWidth(width);
    if (maintainAspectRatio && imageData) {
      const aspectRatio = imageData.height / imageData.width;
      setNewHeight(Math.round(width * aspectRatio));
    }
  };

  const handleHeightChange = (height: number) => {
    setNewHeight(height);
    if (maintainAspectRatio && imageData) {
      const aspectRatio = imageData.width / imageData.height;
      setNewWidth(Math.round(height * aspectRatio));
    }
  };

  const processImage = async () => {
    if (!imageData || !canvasRef.current) return;

    setProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = newWidth;
    canvas.height = newHeight;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      const format = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
      const qualityValue = outputFormat === 'png' ? 1 : quality / 100;
      
      const processedDataUrl = canvas.toDataURL(format, qualityValue);
      setProcessedUrl(processedDataUrl);
      setProcessing(false);
    };
    
    img.src = imageData.url;
  };

  const downloadProcessedImage = () => {
    if (processedUrl) {
      const link = document.createElement('a');
      link.download = `processed-image.${outputFormat}`;
      link.href = processedUrl;
      link.click();
    }
  };

  const resetImage = () => {
    setImageData(null);
    setProcessedUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Resizer</h1>
            <p className="text-gray-600">Resize and convert images between different formats</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-orange-600" />
                Upload Image
              </h2>

              {!imageData ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Drop image here or click to browse
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports: JPEG, PNG, WebP
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imageData.url}
                      alt="Original"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {imageData.width} × {imageData.height}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{imageData.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(imageData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={resetImage}
                    className="w-full text-red-600 hover:text-red-700 font-semibold py-2"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-orange-600" />
                Settings
              </h2>

              <div className="space-y-6">
                {/* Dimensions */}
                <div>
                  <h3 className="font-semibold mb-3">Dimensions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={newWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={!imageData}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={newHeight}
                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={!imageData}
                      />
                    </div>
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={!imageData}
                    />
                    <span className="ml-2 text-sm text-gray-700">Maintain aspect ratio</span>
                  </label>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={!imageData}
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                {/* Quality */}
                {outputFormat !== 'png' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={!imageData}
                    />
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={processImage}
                  disabled={!imageData || processing}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>{processing ? 'Processing...' : 'Process Image'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {processedUrl && (
            <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Processed Image</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3">Original</h3>
                  {imageData && (
                    <div className="relative">
                      <img
                        src={imageData.url}
                        alt="Original"
                        className="w-full h-64 object-cover rounded-xl border"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                        {imageData.width} × {imageData.height}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Processed</h3>
                  <div className="relative">
                    <img
                      src={processedUrl}
                      alt="Processed"
                      className="w-full h-64 object-cover rounded-xl border"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {newWidth} × {newHeight}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={downloadProcessedImage}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Processed Image</span>
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ImageResizer;