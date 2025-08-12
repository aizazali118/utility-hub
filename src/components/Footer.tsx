import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              UtilityHub
            </h3>
            <p className="text-gray-300 mt-2">Your all-in-one utility toolkit</p>
          </div>
          
          <div className="mb-6">
            <a 
              href="https://aizaz-ali-afridi-dev.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Visit Developer Portfolio</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm">
              © 2025 UtilityHub. Built with ❤️ for productivity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;