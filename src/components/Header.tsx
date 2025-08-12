import React from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            UtilityHub
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/qr-generator" className="text-gray-700 hover:text-blue-600 transition-colors">QR Generator</Link>
            <Link to="/pdf-tools" className="text-gray-700 hover:text-blue-600 transition-colors">PDF Tools</Link>
            <Link to="/ai-chat" className="text-gray-700 hover:text-blue-600 transition-colors">AI Chat</Link>
            <Link to="/image-resizer" className="text-gray-700 hover:text-blue-600 transition-colors">Image Resizer</Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              <Link to="/qr-generator" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>QR Generator</Link>
              <Link to="/pdf-tools" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>PDF Tools</Link>
              <Link to="/ai-chat" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>AI Chat</Link>
              <Link to="/image-resizer" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Image Resizer</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;