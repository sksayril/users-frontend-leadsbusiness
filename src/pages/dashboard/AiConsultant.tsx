import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  SendHorizontal, 
  FileText, 
  BarChart, 
  Lightbulb,
  Trash2,
  Loader
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

// Type for API messages which can include system role
type ApiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// IndexedDB setup
const DB_NAME = 'chatHistoryDB';
const STORE_NAME = 'chatHistory';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveMessagesToDB = async (messages: Message[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Clear existing messages
  store.clear();
  
  // Add each message
  messages.forEach(message => {
    store.add(message);
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const getMessagesFromDB = async (): Promise<Message[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const clearMessagesFromDB = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.clear();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Function to format user input into business context
const formatBusinessPrompt = (input: string): string => {
  // If the input doesn't end with a question mark, add context
  if (!input.trim().endsWith('?') && !input.trim().endsWith('.')) {
    return `${input} for my business?`;
  }
  return input;
};

const AiConsultant: React.FC = () => {
  const initialMessage: Message = {
    id: '1',
    content: "Hello! I'm your AI Business Consultant. How can I help you improve your business today?",
    role: 'assistant',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Load chat history from IndexedDB
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await getMessagesFromDB();
        if (savedMessages && savedMessages.length > 0) {
          // Convert string dates back to Date objects
          const messagesWithDates = savedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    
    loadMessages();
  }, []);
  
  // Save messages to IndexedDB whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToDB(messages).catch(error => {
        console.error('Failed to save chat history:', error);
      });
    }
  }, [messages]);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    // Format the user message to ensure business context
    const formattedMessage = formatBusinessPrompt(inputMessage);
    
    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: formattedMessage,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Prepare messages in the format expected by the API
      const apiMessages: ApiMessage[] = messages
        .concat(newUserMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Enhance the system message to ensure markdown and structured business advice
      apiMessages.unshift({
        role: 'system',
        content: `You are an expert business consultant. Format your responses in markdown with proper headings, bullet points, and numbered lists for readability. Keep explanations concise and focused on practical business advice. Always structure your responses with clear sections and actionable insights.`
      });
      
      // Call the API
      const response = await axios.post('https://api.a0.dev/ai/llm', {
        messages: apiMessages
      });
      
      // Extract response
      const aiResponse = response.data.completion || "I'm sorry, I couldn't process that request. Please try again.";
      
      // Add AI response to messages
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = async () => {
    try {
      await clearMessagesFromDB();
      
      // Reset to initial message
      setMessages([{
        id: Date.now().toString(),
        content: "Hello! I'm your AI Business Consultant. How can I help you improve your business today?",
        role: 'assistant',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };
  
  // Business prompt suggestions
  const businessPrompts = [
    "How can I improve customer retention?",
    "Strategies to reduce operational costs",
    "Best marketing approaches for small businesses",
    "How to analyze business performance metrics",
    "Tips for expanding to new markets"
  ];

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Business Consultant</h1>
          <p className="text-gray-600">Get personalized business insights and recommendations powered by AI</p>
        </div>
        
        <button 
          onClick={handleClearChat}
          className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
        >
          <Trash2 size={16} className="mr-2" />
          Clear Chat
        </button>
      </div>
      
      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="markdown-content text-sm">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Customize heading styles
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-md font-bold my-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-semibold my-1.5" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-sm font-semibold my-1" {...props} />,
                        
                        // List styles
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="leading-tight" {...props} />,
                        
                        // Paragraph styles
                        p: ({node, ...props}) => <p className="my-1.5" {...props} />,
                        
                        // Other element styles
                        a: ({node, ...props}) => <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2" {...props} />,
                        code: ({node, ...props}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-gray-200 p-2 rounded my-2 overflow-x-auto text-xs" {...props} />
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div>{message.content}</div>
                )}
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader size={16} className="text-purple-600 animate-spin" />
                  <span className="text-sm text-gray-600">Crafting business insights...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your business challenges..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={inputMessage.trim() === '' || isLoading}
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {businessPrompts.map((prompt, index) => (
              <button 
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Feature Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-start">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
            <p className="text-gray-600 text-sm">Get data-driven recommendations tailored to your business goals.</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-start">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Business Strategies</h3>
            <p className="text-gray-600 text-sm">Receive actionable advice to improve your business operations.</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-start">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <BarChart size={24} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Growth Opportunities</h3>
            <p className="text-gray-600 text-sm">Identify new ways to expand your business and increase revenue.</p>
          </div>
        </div>
      </div>
      
      {/* Add CSS for markdown styling */}
      <style>{`
        .markdown-content h1 { font-size: 1.25rem; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 700; }
        .markdown-content h2 { font-size: 1.125rem; margin-top: 0.75rem; margin-bottom: 0.5rem; font-weight: 600; }
        .markdown-content h3 { font-size: 1rem; margin-top: 0.75rem; margin-bottom: 0.25rem; font-weight: 600; }
        .markdown-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .markdown-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .markdown-content li { margin-bottom: 0.25rem; }
        .markdown-content p { margin-bottom: 0.5rem; }
        .markdown-content a { color: #4F46E5; text-decoration: underline; }
        .markdown-content code { background-color: #f1f1f1; padding: 0.1rem 0.2rem; border-radius: 0.2rem; font-size: 0.875rem; }
        .markdown-content pre { background-color: #f1f1f1; padding: 0.5rem; border-radius: 0.3rem; overflow-x: auto; margin: 0.5rem 0; }
        .markdown-content blockquote { border-left: 3px solid #d1d5db; padding-left: 0.75rem; font-style: italic; margin: 0.5rem 0; }
        .markdown-content table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
        .markdown-content th, .markdown-content td { border: 1px solid #d1d5db; padding: 0.25rem 0.5rem; text-align: left; }
        .markdown-content th { background-color: #f3f4f6; }
      `}</style>
    </div>
  );
};

export default AiConsultant;