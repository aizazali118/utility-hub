import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Table, Image as ImageIcon, Eye, FileSpreadsheet, AlertCircle, Loader, Settings, Copy, Check } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';

interface ExtractedData {
  text: string;
  confidence: number;
  tableData?: string[][];
}

const ImageToText: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractionType, setExtractionType] = useState<'text' | 'table' | 'document'>('table');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [imageEnhancement, setImageEnhancement] = useState(true);
  const [contrastLevel, setContrastLevel] = useState(1.5);
  const [brightnessLevel, setBrightnessLevel] = useState(1.2);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  };

  const handleImageSelect = (file: File) => {
    setImage(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setExtractedData(null);
    setProcessedImageUrl('');
  };

  const enhanceImage = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not available'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply image enhancements
          for (let i = 0; i < data.length; i += 4) {
            // Apply brightness and contrast
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness adjustment
            r *= brightnessLevel;
            g *= brightnessLevel;
            b *= brightnessLevel;

            // Contrast adjustment
            r = ((r / 255 - 0.5) * contrastLevel + 0.5) * 255;
            g = ((g / 255 - 0.5) * contrastLevel + 0.5) * 255;
            b = ((b / 255 - 0.5) * contrastLevel + 0.5) * 255;

            // Convert to grayscale for better OCR
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply threshold for better text recognition
            const threshold = 128;
            const binaryValue = gray > threshold ? 255 : 0;

            data[i] = binaryValue;     // Red
            data[i + 1] = binaryValue; // Green
            data[i + 2] = binaryValue; // Blue
            // Alpha channel remains unchanged
          }

          // Put processed image data back
          ctx.putImageData(imageData, 0, 0);

          // Convert to data URL
          const processedDataUrl = canvas.toDataURL('image/png');
          resolve(processedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const extractText = async () => {
    if (!image) return;

    setProcessing(true);
    setProgress(0);
    setExtractedData(null);

    try {
      let imageToProcess = image;
      
      // Enhance image if enabled
      if (imageEnhancement) {
        setProgress(10);
        const enhancedImageUrl = await enhanceImage(image);
        setProcessedImageUrl(enhancedImageUrl);
        
        // Convert enhanced image back to blob for OCR
        const response = await fetch(enhancedImageUrl);
        const blob = await response.blob();
        imageToProcess = new File([blob], image.name, { type: 'image/png' });
        setProgress(20);
      }

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const ocrProgress = imageEnhancement ? 20 + (m.progress * 70) : m.progress * 90;
            setProgress(Math.round(ocrProgress));
          }
        }
      });

      // Configure OCR for better table recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,()-/:',
        tessedit_pageseg_mode: extractionType === 'table' ? Tesseract.PSM.SPARSE_TEXT : Tesseract.PSM.SINGLE_BLOCK,
      });

      const { data } = await worker.recognize(imageToProcess);
      await worker.terminate();

      let processedData: ExtractedData = {
        text: data.text,
        confidence: data.confidence
      };

      // Process based on extraction type
      if (extractionType === 'table') {
        processedData = processAdvancedTableData(data.text, data);
      } else if (extractionType === 'document') {
        processedData = processDocumentData(data.text);
      }

      setExtractedData(processedData);
      setProgress(100);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text from image. Please try again with different settings.');
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const processAdvancedTableData = (text: string, ocrData: any): ExtractedData => {
    const lines = text.split('\n').filter(line => line.trim());
    const tableData: string[][] = [];
    
    // Enhanced table detection patterns
    const tablePatterns = [
      /\|/,                    // Pipe separators
      /\t/,                    // Tab separators
      /\s{3,}/,               // Multiple spaces
      /\d+\s+[A-Za-z]/,       // Number followed by text (common in specs)
      /[A-Za-z]+\s+\d+/,      // Text followed by number
    ];

    lines.forEach(line => {
      let cells: string[] = [];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return;

      // Try different parsing strategies
      if (trimmedLine.includes('|')) {
        // Pipe-separated values
        cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
      } else if (trimmedLine.includes('\t')) {
        // Tab-separated values
        cells = trimmedLine.split('\t').map(cell => cell.trim()).filter(cell => cell);
      } else if (trimmedLine.match(/\s{3,}/)) {
        // Multiple spaces as separators
        cells = trimmedLine.split(/\s{3,}/).map(cell => cell.trim()).filter(cell => cell);
      } else {
        // Try to detect column-like structure
        // Look for patterns like "Precision 3470" "Intel Core i5-1570P" etc.
        const matches = trimmedLine.match(/(\w+\s+\w+|\w+\s+\d+|\d+\w+|\w+)/g);
        if (matches && matches.length > 1) {
          cells = matches.map(match => match.trim());
        } else {
          // Single column or unstructured text
          cells = [trimmedLine];
        }
      }
      
      if (cells.length > 0) {
        // Clean up cells
        const cleanedCells = cells.map(cell => 
          cell.replace(/[^\w\s\-\.\/\(\)]/g, ' ')
               .replace(/\s+/g, ' ')
               .trim()
        ).filter(cell => cell && cell.length > 0);
        
        if (cleanedCells.length > 0) {
          tableData.push(cleanedCells);
        }
      }
    });

    // Post-process table data to align columns
    if (tableData.length > 0) {
      const maxColumns = Math.max(...tableData.map(row => row.length));
      
      // Pad rows to have consistent column count
      const normalizedTable = tableData.map(row => {
        const paddedRow = [...row];
        while (paddedRow.length < maxColumns) {
          paddedRow.push('');
        }
        return paddedRow;
      });

      return {
        text,
        confidence: Math.max(ocrData.confidence, 75), // Boost confidence for table processing
        tableData: normalizedTable
      };
    }

    return {
      text,
      confidence: ocrData.confidence,
      tableData: undefined
    };
  };

  const processDocumentData = (text: string): ExtractedData => {
    const cleanedText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: cleanedText,
      confidence: 90
    };
  };

  const downloadAsText = () => {
    if (!extractedData) return;

    const blob = new Blob([extractedData.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_text_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsDocx = () => {
    if (!extractedData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Extracted Text</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Extracted Text Document</h1>
        <div class="metadata">
          <p><strong>Extraction Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Confidence:</strong> ${extractedData.confidence.toFixed(1)}%</p>
          <p><strong>Source:</strong> ${image?.name || 'Unknown'}</p>
        </div>
        <div class="content">${extractedData.text.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_document_${Date.now()}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsExcel = () => {
    if (!extractedData?.tableData) return;

    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(extractedData.tableData);

      const colWidths = extractedData.tableData[0]?.map((_, colIndex) => {
        const maxLength = Math.max(
          ...extractedData.tableData!.map(row =>
            row[colIndex] ? row[colIndex].toString().length : 0
          )
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      }) || [];

      worksheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `extracted_table_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to create Excel file. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    if (!extractedData?.text) return;

    try {
      await navigator.clipboard.writeText(extractedData.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy text to clipboard');
    }
  };

  const resetTool = () => {
    setImage(null);
    setImageUrl('');
    setProcessedImageUrl('');
    setExtractedData(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Advanced Image to Text Extractor</h1>
            <p className="text-gray-600">Extract text, tables, and documents from images with AI-powered enhancement</p>
          </div>

          {/* Extraction Type Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Extraction Type</h2>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setExtractionType('text')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  extractionType === 'text'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>General Text</span>
              </button>
              <button
                onClick={() => setExtractionType('table')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  extractionType === 'table'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Table className="w-5 h-5" />
                <span>Table Data</span>
              </button>
              <button
                onClick={() => setExtractionType('document')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  extractionType === 'document'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Document</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-green-600" />
                Upload Image
              </h2>

              {!image ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Drop image here or click to browse
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports: JPG, PNG, GIF, BMP, WebP, TIFF
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Selected"
                      className="w-full max-h-64 object-contain rounded-xl border"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                      Original
                    </div>
                  </div>
                  
                  {processedImageUrl && (
                    <div className="relative">
                      <img
                        src={processedImageUrl}
                        alt="Enhanced"
                        className="w-full max-h-64 object-contain rounded-xl border"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 bg-opacity-90 text-white px-3 py-1 rounded-lg text-sm">
                        Enhanced
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p>Type: {image.type}</p>
                    </div>
                    <button
                      onClick={resetTool}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-green-600" />
                Enhancement Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={imageEnhancement}
                      onChange={(e) => setImageEnhancement(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="font-medium text-gray-700">Enable Image Enhancement</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically enhance image quality for better OCR results
                  </p>
                </div>

                {imageEnhancement && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contrast: {contrastLevel.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={contrastLevel}
                        onChange={(e) => setContrastLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brightness: {brightnessLevel.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={brightnessLevel}
                        onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {/* Extract Button */}
                <button
                  onClick={extractText}
                  disabled={processing || !image}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing... {progress}%</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      <span>Extract {extractionType === 'table' ? 'Table' : extractionType === 'document' ? 'Document' : 'Text'}</span>
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {processing && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-green-600" />
                Extracted Content
              </h2>

              {extractedData ? (
                <div className="space-y-6">
                  {/* Confidence Score */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Confidence: {extractedData.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Text Display with Copy Button */}
                  {extractedData.text && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Extracted Text:</h3>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-['Inter',_'Manrope',_system-ui,_sans-serif]">
                          {extractedData.text}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Table Preview */}
                  {extractionType === 'table' && extractedData.tableData && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Table Preview:</h3>
                      <div className="overflow-x-auto border rounded-lg max-h-64">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="bg-white divide-y divide-gray-200">
                            {extractedData.tableData.slice(0, 15).map((row, rowIndex) => (
                              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50 font-medium' : ''}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                                    {cell || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {extractedData.tableData.length > 15 && (
                        <p className="text-sm text-gray-500">
                          Showing first 15 rows of {extractedData.tableData.length} total rows
                        </p>
                      )}
                    </div>
                  )}

                  {/* Download Options */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Download Options:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={downloadAsText}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download as TXT</span>
                      </button>

                      {extractionType === 'document' && (
                        <button
                          onClick={downloadAsDocx}
                          className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Download as DOCX</span>
                        </button>
                      )}

                      {extractionType === 'table' && extractedData.tableData && (
                        <button
                          onClick={downloadAsExcel}
                          className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-all duration-300"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Download as Excel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Upload an image and click extract to see the results here</p>
                </div>
              )}
            </div>
          </div>

          {/* Feature Information */}
          <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-semibold mb-6 text-center">Advanced OCR Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Image Enhancement</h4>
                <p className="text-sm text-gray-600">
                  Automatic contrast and brightness adjustment for clearer text recognition
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Table className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Smart Table Detection</h4>
                <p className="text-sm text-gray-600">
                  Advanced algorithms to detect and extract tabular data with proper formatting
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Excel Export</h4>
                <p className="text-sm text-gray-600">
                  Export tables directly to Excel with proper formatting and styling
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900">High Accuracy</h4>
                <p className="text-sm text-gray-600">
                  AI-powered OCR with preprocessing for maximum text recognition accuracy
                </p>
              </div>
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ImageToText;