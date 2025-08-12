import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, FileText, MessageSquare, ImageIcon, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: QrCode,
      title: 'QR Code Generator',
      description: 'Generate custom QR codes for URLs, text, and more with various styling options.',
      path: '/qr-generator',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: 'PDF Tools',
      description: 'Convert between PDF, Word, and images. Complete document conversion suite.',
      path: '/pdf-tools',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageSquare,
      title: 'AI Chat System',
      description: 'Intelligent chat interface powered by AI for questions and assistance.',
      path: '/ai-chat',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: ImageIcon,
      title: 'Image Resizer',
      description: 'Resize and convert images between formats: JPEG, PNG, WebP with quality control.',
      path: '/image-resizer',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Ultimate
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Utility Hub</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your workflow with our comprehensive suite of tools. Generate QR codes, 
            convert documents, chat with AI, and optimize images - all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.path}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <section className="mt-20 bg-white rounded-3xl p-8 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-blue-600 mb-2">4</h3>
              <p className="text-gray-600">Powerful Tools</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">100%</h3>
              <p className="text-gray-600">Free to Use</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-600 mb-2">24/7</h3>
              <p className="text-gray-600">Available</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-orange-600 mb-2">∞</h3>
              <p className="text-gray-600">Possibilities</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default Home;