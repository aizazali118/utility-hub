import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Settings, Zap, X, Plus } from 'lucide-react';

interface ImageData {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  processedUrl?: string;
}

const ImageResizer: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [newWidth, setNewWidth] = useState<number>(0);
  const [newHeight, setNewHeight] = useState<number>(0);
  const [quality, setQuality] = useState<number>(90);
  const [outputFormat, setOutputFormat] = useState<string>('jpeg');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (bulkMode) {
        Array.from(files).forEach(file => loadImage(file));
      } else {
        // Single mode - replace existing images
        setImages([]);
        if (files[0]) {
          loadImage(files[0]);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (bulkMode) {
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) {
            loadImage(file);
          }
        });
      } else {
        // Single mode - replace existing images
        setImages([]);
        const file = files[0];
        if (file && file.type.startsWith('image/')) {
          loadImage(file);
        }
      }
    }
  };

  const loadImage = (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    img.onload = () => {
      const imageData: ImageData = {
        id,
        file,
        url,
        width: img.width,
        height: img.height
      };
      
      setImages(prev => [...prev, imageData]);
      
      // Set dimensions based on first image if not set
      if (newWidth === 0 && newHeight === 0) {
        setNewWidth(img.width);
        setNewHeight(img.height);
      }
    };
    
    img.src = url;
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleWidthChange = (width: number) => {
    setNewWidth(width);
    if (maintainAspectRatio && images.length > 0) {
      const firstImage = images[0];
      const aspectRatio = firstImage.height / firstImage.width;
      setNewHeight(Math.round(width * aspectRatio));
    }
  };

  const handleHeightChange = (height: number) => {
    setNewHeight(height);
    if (maintainAspectRatio && images.length > 0) {
      const firstImage = images[0];
      const aspectRatio = firstImage.width / firstImage.height;
      setNewWidth(Math.round(height * aspectRatio));
    }
  };

  const processImage = async (imageData: ImageData): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        let format = 'image/jpeg';
        let qualityValue = quality / 100;
        
        switch (outputFormat) {
          case 'png':
            format = 'image/png';
            qualityValue = 1;
            break;
          case 'webp':
            format = 'image/webp';
            break;
          case 'avif':
            format = 'image/avif';
            break;
          default:
            format = 'image/jpeg';
        }
        
        try {
          const processedDataUrl = canvas.toDataURL(format, qualityValue);
          resolve(processedDataUrl);
        } catch (error) {
          // Fallback to JPEG if format not supported
          const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
          resolve(fallbackDataUrl);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData.url;
    });
  };

  const processAllImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    
    try {
      const processedImages = await Promise.all(
        images.map(async (imageData) => {
          const processedUrl = await processImage(imageData);
          return { ...imageData, processedUrl };
        })
      );
      
      setImages(processedImages);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Some images failed to process. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (imageData: ImageData) => {
    if (imageData.processedUrl) {
      const link = document.createElement('a');
      const fileName = imageData.file.name.split('.')[0];
      link.download = `${fileName}_resized.${outputFormat}`;
      link.href = imageData.processedUrl;
      link.click();
    }
  };

  const downloadAllImages = () => {
    images.forEach((imageData, index) => {
      if (imageData.processedUrl) {
        setTimeout(() => {
          downloadImage(imageData);
        }, index * 100); // Stagger downloads
      }
    });
  };

  const resetImages = () => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasProcessedImages = images.some(img => img.processedUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Resizer</h1>
            <p className="text-gray-600">Resize and convert images between different formats - single or bulk processing</p>
          </div>

          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-gray-700 font-medium">Processing Mode:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {setBulkMode(false); resetImages();}}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    !bulkMode 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Single Image
                </button>
                <button
                  onClick={() => {setBulkMode(true); resetImages();}}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    bulkMode 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Bulk Processing
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-orange-600" />
                Upload Images {bulkMode && '(Bulk Mode)'}
              </h2>

              {images.length === 0 ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    {bulkMode 
                      ? 'Drop multiple images here or click to browse' 
                      : 'Drop image here or click to browse'
                    }
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports: JPEG, PNG, WebP, AVIF
                    {bulkMode && ' (Select multiple files)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={bulkMode}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Add more images button for bulk mode */}
                  {bulkMode && (
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">
                        {images.length} image{images.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add More Images</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Images Grid */}
                  <div className={`grid gap-4 ${
                    bulkMode 
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}>
                    {images.map((imageData) => (
                      <div key={imageData.id} className="relative group">
                        <div className="relative">
                          <img
                            src={imageData.url}
                            alt="Selected"
                            className={`w-full object-cover rounded-xl border ${
                              bulkMode ? 'h-32' : 'h-64'
                            }`}
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                            {imageData.width} × {imageData.height}
                          </div>
                          <button
                            onClick={() => removeImage(imageData.id)}
                            className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {!bulkMode && (
                          <div className="mt-2 text-center">
                            <p className="font-semibold text-gray-900 text-sm">{imageData.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(imageData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={resetImages}
                      className="text-red-600 hover:text-red-700 font-semibold py-2"
                    >
                      Remove All Images
                    </button>
                  </div>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={newWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={images.length === 0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={newHeight}
                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={images.length === 0}
                      />
                    </div>
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={images.length === 0}
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
                    disabled={images.length === 0}
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="avif">AVIF</option>
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
                      disabled={images.length === 0}
                    />
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={processAllImages}
                  disabled={images.length === 0 || processing}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>
                    {processing 
                      ? 'Processing...' 
                      : `Process ${images.length} Image${images.length !== 1 ? 's' : ''}`
                    }
                  </span>
                </button>

                {/* Download All Button */}
                {hasProcessedImages && (
                  <button
                    onClick={downloadAllImages}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download All Processed</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {hasProcessedImages && (
            <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Processed Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.filter(img => img.processedUrl).map((imageData) => (
                  <div key={imageData.id} className="space-y-4">
                    <div className="relative">
                      <img
                        src={imageData.processedUrl}
                        alt="Processed"
                        className="w-full h-48 object-cover rounded-xl border"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                        {newWidth} × {newHeight}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm mb-2">
                        {imageData.file.name.split('.')[0]}_resized.{outputFormat}
                      </p>
                      <button
                        onClick={() => downloadImage(imageData)}
                        className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 text-sm flex items-center justify-center space-x-2 mx-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
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