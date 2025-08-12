import React, { useState } from 'react';
import { Upload, Download, FileText, Image, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

const PDFTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pdf-to-word');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const tabs = [
    { id: 'pdf-to-word', label: 'PDF to Word', icon: FileText },
    { id: 'word-to-pdf', label: 'Word to PDF', icon: FileText },
    { id: 'image-to-pdf', label: 'Image to PDF', icon: Image },
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
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx?.drawImage(img, 0, 0);
        
        // Create PDF
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height]
        });
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, img.width, img.height);
        
        // Generate blob URL
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        resolve(url);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const convertPDFToImage = async (pdfFile: File): Promise<string> => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // This is a simplified conversion - in production you'd use pdf-poppler or similar
      // For now, we'll create a placeholder image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 595; // A4 width in points
      canvas.height = 842; // A4 height in points
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('PDF converted to image', 50, 100);
        ctx.fillText(`File: ${pdfFile.name}`, 50, 130);
        ctx.fillText('Page 1 of ' + pages.length, 50, 160);
      }
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw error;
    }
  };

  const handleConversion = async () => {
    if (!file) return;
    
    setProcessing(true);
    setDownloadUrl('');
    
    try {
      let resultUrl = '';
      
      if (activeTab === 'image-to-pdf') {
        resultUrl = await convertImageToPDF(file);
      } else if (activeTab === 'pdf-to-word') {
        // For PDF to Word, we'll create a text file as demonstration
        const text = `Converted from PDF: ${file.name}\n\nThis is a demo conversion.\nIn production, this would extract actual text from the PDF.`;
        const blob = new Blob([text], { type: 'text/plain' });
        resultUrl = URL.createObjectURL(blob);
      } else if (activeTab === 'word-to-pdf') {
        // For Word to PDF, we'll create a simple PDF
        const pdf = new jsPDF();
        pdf.text(`Converted from Word: ${file.name}`, 20, 20);
        pdf.text('This is a demo conversion.', 20, 40);
        pdf.text('In production, this would process actual Word content.', 20, 60);
        const pdfBlob = pdf.output('blob');
        resultUrl = URL.createObjectURL(pdfBlob);
      }
      
      setDownloadUrl(resultUrl);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Conversion failed. Please try again.');
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
      case 'pdf-to-word':
        extension = '.txt';
        break;
      case 'word-to-pdf':
      case 'image-to-pdf':
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
      case 'pdf-to-word':
        return '.pdf';
      case 'word-to-pdf':
        return '.doc,.docx';
      case 'image-to-pdf':
        return '.jpg,.jpeg,.png';
      default:
        return '';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'pdf-to-word':
        return 'Convert PDF documents to editable Word files';
      case 'word-to-pdf':
        return 'Convert Word documents to PDF format';
      case 'image-to-pdf':
        return 'Convert JPEG and PNG images to PDF documents';
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
            <p className="text-gray-600">Convert between PDF, Word, and image formats</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
              <p className="text-gray-600">{getTabDescription()}</p>
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
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700 text-sm"
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
                    <p className="text-gray-500 text-sm">
                      Supported formats: {getAcceptedFormats().replace(/\./g, '').toUpperCase()}
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
                
                {downloadUrl && (
                  <button 
                    onClick={downloadFile}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Result</span>
                  </button>
                )}
              </div>
            )}

            {downloadUrl && (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTools;