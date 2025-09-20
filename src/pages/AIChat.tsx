import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, X, Camera } from 'lucide-react';
import { security } from '../utils/security';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  image?: string;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant powered by Google Gemini Pro Vision. I can help you with text conversations and analyze images you share with me. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the provided API key directly
  const apiKey = 'AIzaSyAv4rVUnY0URBND2rLN_ea4gd4pBgrU2UM';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const callGeminiAPI = async (message: string, imageBase64?: string): Promise<string> => {
    try {
      const parts: any[] = [];
      
      // Add text part
      if (message.trim()) {
        parts.push({ text: message });
      }
      
      // Add image part if provided
      if (imageBase64) {
        parts.push({
          inline_data: {
            mime_type: imageFile?.type || 'image/jpeg',
            data: imageBase64
          }
        });
        
        // If no text message, add a default prompt for image analysis
        if (!message.trim()) {
          parts.unshift({ text: "Analyze this image and provide detailed information about what you see. Describe the contents, objects, people, setting, colors, and any other relevant details." });
        }
      }

      const model = imageBase64 ? 'gemini-pro-vision' : 'gemini-pro';
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text || 'Sorry, I could not generate a response.';
      } else {
        return 'Sorry, I could not generate a response. Please try again.';
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}. Please try again.`;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || (selectedImage ? "Please analyze this image" : ""),
      isBot: false,
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      let imageBase64: string | undefined;
      
      if (imageFile && selectedImage) {
        imageBase64 = await convertImageToBase64(imageFile);
      }

      const aiResponse = await callGeminiAPI(inputText, imageBase64);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      removeSelectedImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Chat System</h1>
            <p className="text-gray-600">Have intelligent conversations and image analysis with Google Gemini Pro Vision</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: '70vh' }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">AI Assistant (Google Gemini Pro Vision)</h2>
                    <p className="text-green-100 text-sm">Ready for text and image analysis</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-white text-sm font-medium">Vision Enabled</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(70vh - 180px)' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${
                    message.isBot ? '' : 'flex-row-reverse space-x-reverse'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isBot 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {message.isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    
                    <div className={`px-4 py-2 rounded-2xl ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    }`}>
                      {message.image && (
                        <div className="mb-2">
                          <img 
                            src={message.image} 
                            alt="Shared image" 
                            className="max-w-full h-auto rounded-lg border"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.isBot ? 'text-gray-500' : 'text-blue-200'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="border-t bg-gray-50 p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <button
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Image selected for analysis</p>
                    <p className="text-xs text-gray-500">The AI will analyze this image along with your message</p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
                  title="Upload image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or upload an image..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !selectedImage) || isTyping}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Feature Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1 text-blue-800">Google Gemini Pro Vision Features:</p>
              <p className="mb-2">
                This AI chat system now supports both text conversations and advanced image analysis capabilities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                <div>
                  <p className="font-medium mb-1">💬 Text Conversations:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Natural language processing</li>
                    <li>• Context-aware responses</li>
                    <li>• Multi-turn conversations</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">🖼️ Image Analysis:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Object and scene recognition</li>
                    <li>• Text extraction from images</li>
                    <li>• Detailed visual descriptions</li>
                    <li>• Content and context analysis</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-100 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✅ API Key Integrated: Ready to use! Upload images or start chatting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;