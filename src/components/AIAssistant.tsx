import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { AiChatResponse, AiMessage, AiSuggestion, QuickAction } from '../lib/types';
import QUICK_ACTIONS from '../data/chatbotQuickActions';

export function AIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to TUTBOT! I am Tut-Assistant. Ask me about places, budgets, or trip ideas in Egypt.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const conversationMessages = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages: AiMessage[] = [
      ...messages,
      {
        role: 'user',
        content: trimmed,
      },
    ];

    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await api.post<AiChatResponse>('/ai/chat', {
        conversation_id: conversationId,
        messages: [...conversationMessages, { role: 'user', content: trimmed }],
      });

      setConversationId(response.conversation_id);
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the AI service just now. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (isSending) return;
    setIsSending(true);

    // add user-like message locally for UI
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: action.prompt },
    ]);

    try {
      const response = await api.post<AiChatResponse>('/ai/chat', {
        conversation_id: conversationId,
        messages: [...conversationMessages, { role: 'user', content: action.prompt }],
        quick_action: action.key,
      });

      setConversationId(response.conversation_id);
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I could not reach the AI service just now. Please try again in a moment.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const renderSuggestion = (suggestion: AiSuggestion) => {
    if (suggestion.type === 'landmark') {
      return (
        <button
          key={suggestion.id}
          onClick={() => navigate(`/landmark/${suggestion.id}`)}
          className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
        >
          {suggestion.name}
        </button>
      );
    }

    return (
      <button
        key={suggestion.id}
        onClick={() => suggestion.landmark_id && navigate(`/book/${suggestion.landmark_id}`)}
        className="rounded-full border border-royal/20 bg-royal/10 px-3 py-1 text-xs font-medium text-royal transition-colors hover:bg-royal/20"
      >
        {suggestion.label ?? 'Open booking'}
      </button>
    );
  };
  return (
    <>
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.9
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.9
          }}
          className="fixed bottom-24 right-6 w-80 sm:w-96 glass rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{
            height: '500px'
          }}>
          
            <div className="bg-royal text-white p-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-gold" />
                <span className="font-serif font-semibold text-lg">
                  Tut-Assistant
                </span>
              </div>
              <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-offwhite/50 dark:bg-midnight/60">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-royal text-white rounded-tr-sm' : 'bg-white dark:bg-slate-card text-navy dark:text-slate-200 shadow-sm border border-sand dark:border-slate-border rounded-tl-sm'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Sparkles className="w-4 h-4 text-gold mb-1 inline-block mr-1" />
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-sm whitespace-pre-line">{msg.content}</p>
                      {msg.source === 'fallback' && (
                        <span className="ml-2 text-xs text-gray-500">(offline)</span>
                      )}
                      {msg.source === 'canned' && (
                        <span className="ml-2 text-xs text-green-600">(quick)</span>
                      )}
                      {msg.source === 'llm' && (
                        <span className="ml-2 text-xs text-blue-600">(AI)</span>
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.suggestions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map(renderSuggestion)}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl bg-white dark:bg-slate-card text-navy dark:text-slate-200 shadow-sm border border-sand dark:border-slate-border rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <p className="text-sm">Tut-Assistant is thinking...</p>
                  </div>
                </div>
              )}
              {/* Quick action chips */}
              <div className="mt-2">
                <div className="flex gap-2 flex-wrap">
                  {QUICK_ACTIONS.slice(0,4).map((a) => (
                    <button
                      key={a.key}
                      onClick={() => handleQuickAction(a)}
                      className="rounded-full border border-sand bg-white px-3 py-1 text-xs font-medium text-navy hover:bg-sand/50 transition-colors"
                    >
                      {a.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full border border-transparent bg-transparent px-3 py-1 text-xs font-medium text-navy/40"
                  >
                    More
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-card border-t border-sand dark:border-slate-border">
              <div className="flex gap-2">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about trips, budget..."
                className="flex-1 bg-sand/50 dark:bg-midnight/60 border border-transparent dark:border-slate-border text-navy dark:text-slate-200 placeholder:text-navy/40 dark:placeholder:text-slate-400 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              
                <button
                onClick={handleSend}
                disabled={isSending}
                className="bg-gold text-white p-2 rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <motion.button
        initial={{
          y: 0
        }}
        animate={{
          y: [-5, 5, -5]
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut'
        }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-royal text-gold rounded-full shadow-glow flex items-center justify-center hover:scale-105 transition-transform z-50 border-2 border-gold/30">
        
        <Bot className="w-7 h-7" />
      </motion.button>
    </>);

}