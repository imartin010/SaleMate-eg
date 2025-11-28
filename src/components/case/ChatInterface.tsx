import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useAuthStore } from '../../store/auth';
import { supabase } from '@/core/api/client';
import { sendChatMessage, getChatMessages, initializeChat } from '../../lib/api/caseApi';
import { playMessageSentSound, playMessageReceivedSound } from '../../utils/soundEffects';
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
  const previousMessageCountRef = useRef<number>(0);
  
  // Mute state - load from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('chat-sounds-muted');
    return saved === 'true';
  });
  
  // Save mute state to localStorage
  useEffect(() => {
    localStorage.setItem('chat-sounds-muted', String(isMuted));
  }, [isMuted]);
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Load chat messages on mount
  useEffect(() => {
    // Don't load if lead or leadId is missing
    if (!leadId || !lead?.id) {
      setIsInitializing(false);
      return;
    }

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
            console.log('Initializing chat for lead:', leadId);
            const aiMessage = await initializeChat(leadId, {
              lead: {
                id: lead.id || '',
                name: lead.client_name || 'Unknown',
                phone: lead.client_phone || '',
                project_id: lead.project_id || undefined,
              },
              stage: currentStage || 'new',
            });
            
            console.log('Chat initialization response:', aiMessage);
            if (aiMessage) {
              setMessages([aiMessage]);
            } else {
              console.warn('Chat initialized but no message returned');
            }
          } catch (error: any) {
            console.error('Error initializing chat:', error);
            // Show detailed error to user
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
            const isFunctionError = errorMessage.includes('Function not found') || errorMessage.includes('404');
            
            let userMessage = 'عذراً، حدث خطأ في تهيئة المحادثة.';
            if (isFunctionError) {
              userMessage += '\n\n⚠️ يبدو أن دالة المحادثة غير موجودة. يرجى التحقق من نشر Edge Function.';
            } else if (isNetworkError) {
              userMessage += '\n\n⚠️ خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت.';
            } else if (errorMessage.includes('OpenAI')) {
              userMessage += '\n\n⚠️ خطأ في إعدادات OpenAI. يرجى التحقق من المفاتيح.';
            }
            
            setMessages([{
              id: 'error-init',
              role: 'assistant',
              content: userMessage,
              created_at: new Date().toISOString(),
            }]);
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
  }, [leadId, lead?.id, lead?.client_name, lead?.client_phone, lead?.project_id, currentStage]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!leadId) return;
    
    // Real-time subscription for new chat messages
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
        async (payload) => {
          try {
            // Only reload if it's a chat message
            if (payload.new.activity_type === 'chat' && payload.new.event_type === 'activity') {
              console.log('New chat message received:', payload.new);
              const previousCount = previousMessageCountRef.current;
              const updatedMessages = await getChatMessages(leadId);
              setMessages(updatedMessages);
              previousMessageCountRef.current = updatedMessages.length;
              
              // Play sound if a new assistant message was received
              if (updatedMessages.length > previousCount) {
                const newMessages = updatedMessages.slice(previousCount);
                const hasNewAssistantMessage = newMessages.some(msg => msg.role === 'assistant');
                if (hasNewAssistantMessage && !isMuted) {
                  try {
                    playMessageReceivedSound();
                  } catch (error) {
                    console.debug('Sound effect error:', error);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error in realtime subscription:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);
  
  // Update message count ref when messages change
  useEffect(() => {
    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

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
    
    // Play sound effect for message sent (if not muted)
    if (!isMuted) {
      playMessageSentSound();
    }

    try {
      console.log('Sending message to AI coach...');
      const aiMessage = await sendChatMessage(leadId, {
        message: userMessageContent,
        lead: {
          id: lead.id || '',
          name: lead.client_name || 'Unknown',
          phone: lead.client_phone || '',
          project_id: lead.project_id || undefined,
        },
        stage: currentStage || 'new',
      });

      console.log('AI response received:', aiMessage);

      if (aiMessage) {
        // Reload all messages to get the complete history with correct IDs
        // This ensures both user and AI messages are properly displayed
        const allMessages = await getChatMessages(leadId);
        console.log('All messages after send:', allMessages);
        setMessages(allMessages);
        
        // Play sound effect for message received
        playMessageReceivedSound();
      } else {
        console.warn('No AI message returned, but keeping user message');
        // Don't remove the user message - keep it visible
        // The realtime subscription will update when AI responds
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Show error message to user but keep their message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `عذراً، حدث خطأ في إرسال الرسالة: ${error?.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => {
        // Keep user message and add error message
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        // Add user message back with proper ID if we have it
        const userMsg = prev.find(m => m.id === tempUserMessage.id);
        if (userMsg) {
          return [...filtered, userMsg, errorMessage];
        }
        return [...filtered, errorMessage];
      });
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
    <Card className="flex flex-col bg-white" style={{ maxHeight: '600px', height: '600px' }}>
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">AI Sales Coach</h3>
          </div>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-600" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          Get personalized coaching to close the deal with {lead.client_name}
        </p>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 min-h-0"
      >
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
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
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-1.5 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI coach for advice..."
            className="min-h-[50px] max-h-[100px] resize-none text-sm"
            disabled={isLoading || isInitializing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isInitializing}
            className="self-end"
            size="sm"
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
