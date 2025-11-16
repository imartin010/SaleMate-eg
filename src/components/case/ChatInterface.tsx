import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { sendChatMessage, getChatMessages, initializeChat } from '../../lib/api/caseApi';
import type { Lead } from '../../hooks/crm/useLeads';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  leadId: string;
  lead: Lead;
  currentStage: string;
  onRefetch: () => void;
}

export function ChatInterface({ leadId, lead, currentStage, onRefetch }: ChatInterfaceProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Load existing chat messages and initialize if needed
  useEffect(() => {
    const loadChat = async () => {
      try {
        setIsInitializing(true);
        
        // Load existing messages
        const existingMessages = await getChatMessages(leadId);
        
        if (existingMessages.length > 0) {
          setMessages(existingMessages);
          setIsInitializing(false);
        } else {
          // Initialize chat with AI's first message
          try {
            const aiMessage = await initializeChat(leadId, {
              lead: {
                id: lead.id,
                name: lead.client_name,
                phone: lead.client_phone,
                project_id: lead.project_id,
              },
              stage: currentStage,
            });
            
            if (aiMessage) {
              setMessages([aiMessage]);
            } else {
              // Fallback message if initialization fails
              setMessages([{
                id: `fallback-${Date.now()}`,
                role: 'assistant',
                content: `Hello! I'm your AI sales coach. I'm here to help you close the deal with ${lead.client_name}. How can I assist you today?`,
                created_at: new Date().toISOString(),
              }]);
            }
          } catch (error) {
            console.error('Error initializing chat:', error);
            // Fallback message on error
            setMessages([{
              id: `fallback-${Date.now()}`,
              role: 'assistant',
              content: `Hello! I'm your AI sales coach. I'm here to help you close the deal with ${lead.client_name}. How can I assist you today?`,
              created_at: new Date().toISOString(),
            }]);
          }
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        setIsInitializing(false);
      }
    };

    loadChat();
  }, [leadId, lead.id, lead.client_name, lead.client_phone, lead.project_id, currentStage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message and get AI response
      const response = await sendChatMessage(leadId, {
        message: userMessage.content,
        lead: {
          id: lead.id,
          name: lead.client_name,
          phone: lead.client_phone,
          project_id: lead.project_id,
        },
        stage: currentStage,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Add AI response
      if (response) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMessage.id), // Remove temp message
          {
            id: userMessage.id,
            role: 'user',
            content: userMessage.content,
            created_at: userMessage.created_at,
          },
          response,
        ]);
      } else {
        // Remove temp message if no response
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }

      onRefetch();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="p-0 bg-white/80 backdrop-blur-sm border-indigo-100 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Sales Coach</h3>
            <p className="text-xs text-gray-600">Helping you close the deal</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Starting conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-indigo-100 bg-white">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            rows={1}
            className="resize-none min-h-[44px] max-h-[120px] flex-1"
            disabled={isLoading || isInitializing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isInitializing}
            className="bg-indigo-600 hover:bg-indigo-700 h-[44px] px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI coach will help you with strategies, scripts, and recommendations to close this deal
        </p>
      </div>
    </Card>
  );
}

