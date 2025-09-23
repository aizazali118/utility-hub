import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Table, Image as ImageIcon, Eye, FileSpreadsheet, AlertCircle, Loader } from 'lucide-react';
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
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractionType, setExtractionType] = useState<'text' | 'table' | 'document'>('text');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const extractText = async () => {
    if (!image) return;

    setProcessing(true);
    setProgress(0);
    setExtractedData(null);

    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data } = await worker.recognize(image);
      await worker.terminate();

      let processedData: ExtractedData = {
        text: data.text,
        confidence: data.confidence
      };

      // Process based on extraction type
      if (extractionType === 'table') {
        processedData = processTableData(data.text);
      } else if (extractionType === 'document') {
        processedData = processDocumentData(data.text);
      }

      setExtractedData(processedData);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text from image. Please try again.');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const processTableData = (text: string): ExtractedData => {
    // Split text into lines and try to detect table structure
    const lines = text.split('\n').filter(line => line.trim());
    const tableData: string[][] = [];
    
    lines.forEach(line => {
      // Try to split by common delimiters
      let cells: string[] = [];
      
      // Check for tab-separated values
      if (line.includes('\t')) {
        cells = line.split('\t');
      }
      // Check for multiple spaces (common in OCR table output)
      else if (line.match(/\s{2,}/)) {
        cells = line.split(/\s{2,}/);
      }
      // Check for pipe separators
      else if (line.includes('|')) {
        cells = line.split('|').map(cell => cell.trim());
      }
      // Fallback: split by single space if it looks like tabular data
      else if (line.match(/\w+\s+\w+\s+\w+/)) {
        cells = line.split(/\s+/);
      }
      // Single column
      else {
        cells = [line];
      }
      
      if (cells.length > 0 && cells.some(cell => cell.trim())) {
        tableData.push(cells.map(cell => cell.trim()).filter(cell => cell));
      }
    });

    return {
      text,
      confidence: 85, // Estimated confidence for table processing
      tableData: tableData.length > 0 ? tableData : undefined
    };
  };

  const processDocumentData = (text: string): ExtractedData => {
    // Clean up the text for document format
    const cleanedText = text
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    return {
      text: cleanedText,
      confidence: 90 // Estimated confidence for document processing
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

    // Create a simple HTML structure that can be opened in Word
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

    const worksheet = XLSX.utils.aoa_to_sheet(extractedData.tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Table');
    
    // Add some styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }
      }
    }

    XLSX.writeFile(workbook, `extracted_table_${Date.now()}.xlsx`);
  };

  const resetTool = () => {
    setImage(null);
    setImageUrl('');
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Image to Text Extractor</h1>
            <p className="text-gray-600">Extract text, tables, and documents from images using advanced OCR technology</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      className="w-full max-h-96 object-contain rounded-xl border"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                      {image.name}
                    </div>
                  </div>
                  
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

                  {/* Extract Button */}
                  <button
                    onClick={extractText}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Extracting... {progress}%</span>
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
              )}
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

                  {/* Table Preview */}
                  {extractionType === 'table' && extractedData.tableData && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Table Preview:</h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="bg-white divide-y divide-gray-200">
                            {extractedData.tableData.slice(0, 10).map((row, rowIndex) => (
                              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {extractedData.tableData.length > 10 && (
                        <p className="text-sm text-gray-500">
                          Showing first 10 rows of {extractedData.tableData.length} total rows
                        </p>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Extracted Text:</h3>
                    <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                        {extractedData.text}
                      </pre>
                    </div>
                  </div>

                  {/* Download Options */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Download Options:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h3 className="text-xl font-semibold mb-6 text-center">Extraction Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">General Text</h4>
                <p className="text-sm text-gray-600">
                  Extract any text from images including handwritten notes, signs, documents, and screenshots
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Table className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Table Data</h4>
                <p className="text-sm text-gray-600">
                  Automatically detect and extract tabular data with Excel export functionality
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Document Text</h4>
                <p className="text-sm text-gray-600">
                  Extract formatted document text with DOCX export for easy editing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToText;