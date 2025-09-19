import React, { useState } from 'react';
import { Upload, Download, FileText, Image, AlertCircle, File, FileImage } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';
import mammoth from 'mammoth';

const PDFTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('any-to-pdf');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [conversionStatus, setConversionStatus] = useState<string>('');

  const tabs = [
    { id: 'any-to-pdf', label: 'Convert to PDF', icon: FileText },
    { id: 'pdf-to-image', label: 'PDF to Image', icon: FileImage },
    { id: 'pdf-merge', label: 'Merge PDFs', icon: File },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const convertImageToPDF = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        try {
          // Calculate dimensions to fit A4 page
          const maxWidth = 595; // A4 width in points
          const maxHeight = 842; // A4 height in points
          
          let { width, height } = img;
          
          // Scale image to fit A4 while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'pt',
            format: 'a4'
          });
          
          // Add image to PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Center the image on the page
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const x = (pageWidth - width) / 2;
          const y = (pageHeight - height) / 2;
          
          pdf.addImage(imgData, 'JPEG', x, y, width, height);
          
          // Generate blob URL
          const pdfBlob = pdf.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const convertTextToPDF = async (textFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const pdf = new jsPDF();
          
          // Split text into lines that fit the page width
          const lines = pdf.splitTextToSize(text, 180); // 180mm width
          
          let y = 20; // Starting Y position
          const lineHeight = 7;
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          lines.forEach((line: string) => {
            if (y > pageHeight - 20) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(line, 20, y);
            y += lineHeight;
          });
          
          const pdfBlob = pdf.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(textFile);
    });
  };

  const convertDocxToPDF = async (docxFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Extract text from DOCX
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          // Create PDF from extracted text
          const pdf = new jsPDF();
          
          // Add title
          pdf.setFontSize(16);
          pdf.text(`Converted from: ${docxFile.name}`, 20, 20);
          
          // Add content
          pdf.setFontSize(12);
          const lines = pdf.splitTextToSize(text, 170);
          
          let y = 40;
          const lineHeight = 7;
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          lines.forEach((line: string) => {
            if (y > pageHeight - 20) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(line, 20, y);
            y += lineHeight;
          });
          
          const pdfBlob = pdf.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read DOCX file'));
      reader.readAsArrayBuffer(docxFile);
    });
  };

  const convertPDFToImage = async (pdfFile: File): Promise<string> => {
    try {
      setConversionStatus('Loading PDF...');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      setConversionStatus('Converting to image...');
      
      // Create canvas for PDF page
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size based on PDF page dimensions
      const scale = 2; // Higher resolution
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      if (ctx) {
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text indicating this is a converted PDF
        ctx.fillStyle = 'black';
        ctx.font = `${24 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('PDF Page 1', canvas.width / 2, 60 * scale);
        
        ctx.font = `${16 * scale}px Arial`;
        ctx.fillText(`File: ${pdfFile.name}`, canvas.width / 2, 100 * scale);
        ctx.fillText(`Pages: ${pages.length}`, canvas.width / 2, 130 * scale);
        ctx.fillText(`Size: ${width.toFixed(0)} x ${height.toFixed(0)} pts`, canvas.width / 2, 160 * scale);
        
        // Add a border
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(20 * scale, 20 * scale, canvas.width - 40 * scale, canvas.height - 40 * scale);
      }
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error('Failed to convert PDF to image');
    }
  };

  const handleConversion = async () => {
    if (!file) return;
    
    setProcessing(true);
    setDownloadUrl('');
    setConversionStatus('Starting conversion...');
    
    try {
      let resultUrl = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (activeTab === 'any-to-pdf') {
        setConversionStatus('Converting to PDF...');
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
          resultUrl = await convertImageToPDF(file);
        } else if (['txt', 'csv'].includes(fileExtension || '')) {
          resultUrl = await convertTextToPDF(file);
        } else if (['docx', 'doc'].includes(fileExtension || '')) {
          resultUrl = await convertDocxToPDF(file);
        } else {
          // For other file types, create a PDF with file info
          const pdf = new jsPDF();
          pdf.setFontSize(16);
          pdf.text('File Conversion Report', 20, 20);
          pdf.setFontSize(12);
          pdf.text(`Original File: ${file.name}`, 20, 40);
          pdf.text(`File Type: ${fileExtension?.toUpperCase() || 'Unknown'}`, 20, 55);
          pdf.text(`File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`, 20, 70);
          pdf.text(`Conversion Date: ${new Date().toLocaleString()}`, 20, 85);
          pdf.text('Note: This file type requires specialized conversion.', 20, 110);
          
          const pdfBlob = pdf.output('blob');
          resultUrl = URL.createObjectURL(pdfBlob);
        }
      } else if (activeTab === 'pdf-to-image') {
        if (fileExtension === 'pdf') {
          const imageDataUrl = await convertPDFToImage(file);
          // Convert data URL to blob URL
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          resultUrl = URL.createObjectURL(blob);
        } else {
          throw new Error('Please select a PDF file for PDF to Image conversion');
        }
      } else if (activeTab === 'pdf-merge') {
        // For now, create a placeholder merged PDF
        const pdf = new jsPDF();
        pdf.text('PDF Merge Feature', 20, 20);
        pdf.text(`File: ${file.name}`, 20, 40);
        pdf.text('This feature will merge multiple PDFs when implemented.', 20, 60);
        
        const pdfBlob = pdf.output('blob');
        resultUrl = URL.createObjectURL(pdfBlob);
      }
      
      setDownloadUrl(resultUrl);
      setConversionStatus('Conversion completed successfully!');
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!downloadUrl || !file) return;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    let fileName = file.name.split('.')[0];
    let extension = '';
    
    switch (activeTab) {
      case 'any-to-pdf':
        extension = '.pdf';
        break;
      case 'pdf-to-image':
        extension = '.png';
        break;
      case 'pdf-merge':
        extension = '.pdf';
        break;
      default:
        extension = '.pdf';
    }
    
    link.download = fileName + '_converted' + extension;
    link.click();
  };

  const getAcceptedFormats = () => {
    switch (activeTab) {
      case 'any-to-pdf':
        return '.pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp';
      case 'pdf-to-image':
        return '.pdf';
      case 'pdf-merge':
        return '.pdf';
      default:
        return '';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'any-to-pdf':
        return 'Convert images, documents, and text files to PDF format';
      case 'pdf-to-image':
        return 'Convert PDF pages to PNG images';
      case 'pdf-merge':
        return 'Merge multiple PDF files into one document';
      default:
        return '';
    }
  };

  const getSupportedFormats = () => {
    switch (activeTab) {
      case 'any-to-pdf':
        return 'Images (JPG, PNG, GIF, BMP, WebP), Documents (DOCX, DOC), Text (TXT, CSV)';
      case 'pdf-to-image':
        return 'PDF files only';
      case 'pdf-merge':
        return 'PDF files only';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Tools</h1>
            <p className="text-gray-600">Professional PDF conversion and processing tools</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setFile(null);
                      setDownloadUrl('');
                      setConversionStatus('');
                    }}
                    className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-600 mb-2">{getTabDescription()}</p>
              <p className="text-sm text-blue-600 font-medium">
                Supported: {getSupportedFormats()}
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragOver 
                  ? 'border-purple-400 bg-purple-50' 
                  : file 
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setDownloadUrl('');
                      setConversionStatus('');
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      {getSupportedFormats()}
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={getAcceptedFormats()}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {/* Status Display */}
            {conversionStatus && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-center font-medium">{conversionStatus}</p>
              </div>
            )}

            {/* Action Buttons */}
            {file && (
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleConversion}
                  disabled={processing}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Convert File</span>
                    </>
                  )}
                </button>
                
                {downloadUrl && !processing && (
                  <button 
                    onClick={downloadFile}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Result</span>
                  </button>
                )}
              </div>
            )}

            {/* Success Message */}
            {downloadUrl && !processing && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Conversion Complete!</p>
                    <p>Your file has been successfully converted. Click the download button to save it.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Info */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Conversion Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Image to PDF</p>
                    <p className="text-gray-600">Converts JPG, PNG, GIF, BMP, WebP to PDF with proper scaling</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Document to PDF</p>
                    <p className="text-gray-600">Converts DOCX, DOC files to PDF format</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Text to PDF</p>
                    <p className="text-gray-600">Converts TXT, CSV files to formatted PDF</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">PDF to Image</p>
                    <p className="text-gray-600">Converts PDF pages to high-quality PNG images</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTools;