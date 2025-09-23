import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, FileText, Image, Scan, Zap, Shield, Download, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const tools = [
    {
      id: 'qr-generator',
      title: 'QR Code Generator',
      description: 'Create custom QR codes for any text or URL with adjustable size and quality',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-500',
      path: '/qr-generator'
    },
    {
      id: 'pdf-tools',
      title: 'PDF Tools',
      description: 'Convert images, documents, and text files to PDF format or extract content',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      path: '/pdf-tools'
    },
    {
      id: 'image-resizer',
      title: 'Image Resizer',
      description: 'Resize and convert images between different formats with bulk processing',
      icon: Image,
      color: 'from-orange-500 to-red-500',
      path: '/image-resizer'
    },
    {
      id: 'image-to-text',
      title: 'Image to Text',
      description: 'Extract text, tables, and documents from images using advanced OCR technology',
      icon: Scan,
      color: 'from-green-500 to-teal-500',
      path: '/image-to-text'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'All processing happens locally in your browser for maximum speed and privacy'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your files never leave your device. Complete privacy and security guaranteed'
    },
    {
      icon: Download,
      title: 'Multiple Formats',
      description: 'Support for various input and output formats to meet all your needs'
    },
    {
      icon: Sparkles,
      title: 'Professional Quality',
      description: 'High-quality results suitable for both personal and professional use'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your All-in-One
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Utility Toolkit
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Generate QR codes, convert PDFs, extract text from images, and resize photos - 
              all in one powerful, secure, and lightning-fast web application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/qr-generator"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/image-to-text"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                Try OCR Tool
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Tools at Your Fingertips</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each tool is designed with precision and care to deliver professional results instantly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Try it now</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose UtilityHub?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern web technologies to provide the best user experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Boost Your Productivity?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of users who trust UtilityHub for their daily tasks
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/image-to-text"
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Try OCR Tool
              </Link>
              <Link
                to="/pdf-tools"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Convert Files
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;