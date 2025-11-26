import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, Minimize2 } from 'lucide-react';
import { supabase } from '../../core/api/client';
import { useAuthStore } from '../../features/auth/store/auth.store';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface FranchiseAIAssistantProps {
  // No props needed - it's a floating widget
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Hello! I\'m Mr. Blue, your AI assistant. I can help you analyze franchise performance, find the most profitable franchises, compare sales volumes, and answer questions about your franchise network. What would you like to know?',
  timestamp: new Date().toISOString(),
};

export const FranchiseAIAssistant: React.FC<FranchiseAIAssistantProps> = () => {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from database on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('franchise_ai_chat_messages')
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading chat history:', error);
          setIsLoadingHistory(false);
          return;
        }

        if (data && data.length > 0) {
          // Convert database format to Message format
          const loadedMessages: Message[] = data.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.created_at,
          }));
          setMessages(loadedMessages);
        } else {
          // No history found, use initial message
          setMessages([INITIAL_MESSAGE]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const saveMessage = async (message: Message): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('franchise_ai_chat_messages')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          created_at: message.timestamp,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Save user message to database
    const userMessageId = await saveMessage(userMessage);
    if (userMessageId) {
      userMessage.id = userMessageId;
    }

    try {
      // Get conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('franchise-ai-assistant', {
        body: {
          question: userInput,
          conversationHistory,
        },
      });

      if (error) {
        throw error;
      }

      // Add AI response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'I apologize, but I could not generate a response.',
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database
      const assistantMessageId = await saveMessage(assistantMessage);
      if (assistantMessageId) {
        assistantMessage.id = assistantMessageId;
      }
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Save error message to database
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Convert markdown-style bold (**text**) to HTML bold
  // Also handles line breaks and preserves formatting
  const formatMessage = (text: string): string => {
    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // First escape HTML
    let formatted = escapeHtml(text);
    
    // Convert markdown bold (**text**) to HTML bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks to <br> tags
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  // Render message with HTML support for bold text
  const renderMessage = (content: string) => {
    const formatted = formatMessage(content);
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Open Mr. Blue"
        >
          <img 
            src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/sign/Random-files/AIFAVICON.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81Mjk3ZWY4Yi00YWRkLTQ0NWEtODdhYS00YzcyZDA3N2YyODAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJSYW5kb20tZmlsZXMvQUlGQVZJQ09OLnBuZyIsImlhdCI6MTc2NDE2OTgyNiwiZXhwIjoyMDc5NTI5ODI2fQ.2VEJNBYGbj-kIp7OaRTQJqDwiMkLkGv0SAdl85ISNbw" 
            alt="Mr. Blue" 
            className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform"
          />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window - Mobile Responsive */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full h-[calc(100vh-2rem)] sm:w-96 sm:h-[600px] max-h-[600px] bg-white rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/sign/Random-files/AIFAVICON.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81Mjk3ZWY4Yi00YWRkLTQ0NWEtODdhYS00YzcyZDA3N2YyODAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJSYW5kb20tZmlsZXMvQUlGQVZJQ09OLnBuZyIsImlhdCI6MTc2NDE2OTgyNiwiZXhwIjoyMDc5NTI5ODI2fQ.2VEJNBYGbj-kIp7OaRTQJqDwiMkLkGv0SAdl85ISNbw" 
                  alt="Mr. Blue" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Mr. Blue</h3>
                <p className="text-xs text-purple-100">Ask about franchises</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            messages.map((message, index) => (
            <div
              key={message.id || `msg-${index}`}
              className={`flex items-start space-x-2 sm:space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/sign/Random-files/AIFAVICON.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81Mjk3ZWY4Yi00YWRkLTQ0NWEtODdhYS00YzcyZDA3N2YyODAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJSYW5kb20tZmlsZXMvQUlGQVZJQ09OLnBuZyIsImlhdCI6MTc2NDE2OTgyNiwiZXhwIjoyMDc5NTI5ODI2fQ.2VEJNBYGbj-kIp7OaRTQJqDwiMkLkGv0SAdl85ISNbw" 
                    alt="Mr. Blue" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] sm:max-w-[75%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }`}
              >
                <p className={`text-xs sm:text-sm whitespace-pre-wrap ${message.role === 'assistant' ? '' : 'text-white'}`}>
                  {message.role === 'assistant' ? renderMessage(message.content) : message.content}
                </p>
                <p className={`text-[10px] sm:text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
                </div>
              )}
            </div>
          ))
          )}
          {isLoading && (
            <div className="flex items-start space-x-2 sm:space-x-3 justify-start">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/sign/Random-files/AIFAVICON.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81Mjk3ZWY4Yi00YWRkLTQ0NWEtODdhYS00YzcyZDA3N2YyODAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJSYW5kb20tZmlsZXMvQUlGQVZJQ09OLnBuZyIsImlhdCI6MTc2NDE2OTgyNiwiZXhwIjoyMDc5NTI5ODI2fQ.2VEJNBYGbj-kIp7OaRTQJqDwiMkLkGv0SAdl85ISNbw" 
                  alt="Mr. Blue" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="bg-white rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 shadow-sm">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-600" />
              </div>
            </div>
          )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about franchises..."
                className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
