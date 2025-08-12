import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import QRGenerator from './pages/QRGenerator';
import PDFTools from './pages/PDFTools';
import AIChat from './pages/AIChat';
import ImageResizer from './pages/ImageResizer';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/qr-generator" element={<QRGenerator />} />
            <Route path="/pdf-tools" element={<PDFTools />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/image-resizer" element={<ImageResizer />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;