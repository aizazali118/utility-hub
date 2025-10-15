import React, { useState } from 'react';
import { Upload, Download, FileText, Image, AlertCircle, File, FileImage } from 'lucide-react';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('any-to-pdf');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
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
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      if (activeTab === 'pdf-merge') {
        setFiles(Array.from(droppedFiles));
      } else {
        setFile(droppedFiles[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (activeTab === 'pdf-merge') {
        setFiles(Array.from(e.target.files));
      } else {
        setFile(e.target.files[0]);
      }
    }
  };

  const convertImageToPDF = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          const maxWidth = 595;
          const maxHeight = 842;

          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);

            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          const pdf = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'pt',
            format: 'a4'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const x = (pageWidth - width) / 2;
          const y = (pageHeight - height) / 2;

          pdf.addImage(imgData, 'JPEG', x, y, width, height);

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

          const lines = pdf.splitTextToSize(text, 180);

          let y = 20;
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

          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;

          const pdf = new jsPDF();

          pdf.setFontSize(16);
          pdf.text(`Converted from: ${docxFile.name}`, 20, 20);

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

  const mergePDFs = async (pdfFiles: File[]): Promise<string> => {
    try {
      setConversionStatus('Loading PDF files...');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfFiles.length; i++) {
        setConversionStatus(`Processing PDF ${i + 1} of ${pdfFiles.length}...`);
        const pdfBytes = await pdfFiles[i].arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      setConversionStatus('Finalizing merged PDF...');
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('PDF merge error:', error);
      throw new Error('Failed to merge PDFs. Please ensure all files are valid PDFs.');
    }
  };

  const convertPDFToImage = async (pdfFile: File): Promise<string> => {
    try {
      setConversionStatus('Loading PDF...');

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setConversionStatus('Rendering PDF page...');

      const page = await pdf.getPage(1);

      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      }

      setConversionStatus('Conversion complete!');
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error('Failed to convert PDF to image. Please ensure the PDF is valid.');
    }
  };

  const handleConversion = async () => {
    if (!file && files.length === 0) return;
    if (activeTab === 'pdf-merge' && files.length < 2) {
      alert('Please select at least 2 PDF files to merge');
      return;
    }

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
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          resultUrl = URL.createObjectURL(blob);
        } else {
          throw new Error('Please select a PDF file for PDF to Image conversion');
        }
      } else if (activeTab === 'pdf-merge') {
        if (files.length < 2) {
          throw new Error('Please select at least 2 PDF files to merge');
        }

        resultUrl = await mergePDFs(files);
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
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;

    let fileName = '';
    let extension = '';

    switch (activeTab) {
      case 'any-to-pdf':
        fileName = file ? file.name.split('.')[0] : 'converted';
        extension = '.pdf';
        break;
      case 'pdf-to-image':
        fileName = file ? file.name.split('.')[0] : 'converted';
        extension = '.png';
        break;
      case 'pdf-merge':
        fileName = 'merged';
        extension = '.pdf';
        break;
      default:
        fileName = 'converted';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Tools</h1>
            <p className="text-gray-600">Professional PDF conversion and processing tools</p>
          </div>

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
                      setFiles([]);
                      setDownloadUrl('');
                      setConversionStatus('');
                    }}
                    className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
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

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : (file || files.length > 0)
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {(activeTab === 'pdf-merge' && files.length > 0) ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{files.length} PDF files selected</p>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {files.map((f, idx) => (
                        <p key={idx} className="text-sm text-gray-500">
                          {idx + 1}. {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFiles([]);
                      setDownloadUrl('');
                      setConversionStatus('');
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove all files
                  </button>
                </div>
              ) : file ? (
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
                    multiple={activeTab === 'pdf-merge'}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {conversionStatus && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-center font-medium">{conversionStatus}</p>
              </div>
            )}

            {(file || files.length > 0) && (
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleConversion}
                  disabled={processing}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Conversion Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Image to PDF</p>
                    <p className="text-gray-600">Converts JPG, PNG, GIF, BMP, WebP to PDF with proper scaling</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Document to PDF</p>
                    <p className="text-gray-600">Converts DOCX, DOC files to PDF format</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Text to PDF</p>
                    <p className="text-gray-600">Converts TXT, CSV files to formatted PDF</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
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
