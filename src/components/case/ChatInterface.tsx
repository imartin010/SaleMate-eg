import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User } from 'lucide-react';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat messages on mount
  useEffect(() => {
    const loadChat = async () => {
      try {
        setIsInitializing(true);
        
        // Load existing messages
        const existingMessages = await getChatMessages(leadId);
        
        if (existingMessages.length > 0) {
          // Chat exists - load it
          setMessages(existingMessages);
          setIsInitializing(false);
        } else {
          // No chat - initialize
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
            }
          } catch (error) {
            console.error('Error initializing chat:', error);
          } finally {
            setIsInitializing(false);
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        setIsInitializing(false);
      }
    };

    loadChat();
  }, [leadId, lead.id, lead.client_name, lead.client_phone, lead.project_id, currentStage]);

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `lead_id=eq.${leadId}`,
        },
        async () => {
          // Reload messages when new ones are added
          const updatedMessages = await getChatMessages(leadId);
          setMessages(updatedMessages);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const aiMessage = await sendChatMessage(leadId, {
        message: userMessageContent,
        lead: {
          id: lead.id,
          name: lead.client_name,
          phone: lead.client_phone,
          project_id: lead.project_id,
        },
        stage: currentStage,
      });

      if (aiMessage) {
        // Reload all messages to get the complete history with correct IDs
        const allMessages = await getChatMessages(leadId);
        setMessages(allMessages);
      } else {
        // Remove optimistic message if send failed
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
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
    <Card className="flex flex-col h-full bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Sales Coach</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Get personalized coaching to close the deal with {lead.client_name}
        </p>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI coach for advice..."
            className="min-h-[60px] resize-none"
            disabled={isLoading || isInitializing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isInitializing}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
