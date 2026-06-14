import React, { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Plus, Trash2, MessageSquare, ChevronLeft, MapPin, Star, Phone, UtensilsCrossed, Hotel, Landmark, History, Compass, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken } from '../lib/api';
import type { AiChatResponse, AiMessage, AiSuggestion, QuickAction } from '../lib/types';
import QUICK_ACTIONS from '../data/chatbotQuickActions';

interface ConversationListItem {
  id: string;
  title: string;
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

const WELCOME: AiMessage = {
  role: 'assistant',
  content: '🎉 Welcome to TUTBOT! I\'m TutBot 🤖 — your AI travel concierge for Egypt! Ask me about landmarks 🏛️, restaurants 🍽️, hotels 🏨, or trip ideas 🗺️ across Egypt!'
};

const quickIconMap: Record<string, React.ReactNode> = {
  'top_sights_cairo': <Landmark className="w-3.5 h-3.5" />,
  '3_day_itinerary': <Compass className="w-3.5 h-3.5" />,
  'budget_low': <Star className="w-3.5 h-3.5" />,
  'luxury_trip': <Sparkles className="w-3.5 h-3.5" />,
  'beach_getaway': <MapPin className="w-3.5 h-3.5" />,
  'family_friendly': <History className="w-3.5 h-3.5" />,
};

function ensureGuestId(): string {
  let id = localStorage.getItem('tutbot.guest_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('tutbot.guest_id', id);
  }
  return id;
}

const STORAGE_GUEST_ID_KEY = 'tutbot.guest_id';
function getGuestId(): string | null {
  return localStorage.getItem(STORAGE_GUEST_ID_KEY);
}

function FormattedMessage({ text, isUser }: { text: string; isUser?: boolean }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;
  let listOrdered = false;

  const boldItalic = (segment: string) => {
    const parts = segment.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('***') && part.endsWith('***')) {
        return <strong key={i} className="font-bold italic">{part.slice(3, -3)}</strong>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-navy/90 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      const urlMatch = part.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        const parts2 = part.split(/(https?:\/\/[^\s]+)/g);
        return parts2.map((p2, j) => {
          if (p2.match(/^https?:\/\//)) {
            return <a key={`${i}-${j}`} href={p2} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{p2}</a>;
          }
          return <Fragment key={`${i}-${j}`}>{p2}</Fragment>;
        });
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
  };

  const bulletEmojis = ['▸', '✦', '•', '‣'];

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listOrdered ? 'ol' : 'ul';
      elements.push(
        <Tag key={`list-${listKey++}`} className={`list-none my-2 space-y-1.5 text-sm ${isUser ? 'text-white/90' : 'text-navy/85 dark:text-slate-200/90'}`}>
          {listItems}
        </Tag>
      );
      listItems = [];
      listOrdered = false;
    }
  };

  const renderCode = (text: string) => {
    const segments = text.split(/(`[^`]+`)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-sand/40 to-sand/20 dark:from-slate-700/60 dark:to-slate-700/30 text-[13px] font-mono text-rose-600 dark:text-rose-400 border border-sand/40 dark:border-slate-600/40 shadow-sm">{seg.slice(1, -1)}</code>;
      }
      return boldItalic(seg);
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '---') {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-3 border-sand/30 dark:border-slate-700/30" />);
      elements.push(
        <div key={`hr-label-${i}`} className="flex items-center gap-2 my-2 select-none">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sand/30 dark:via-slate-700/30 to-transparent" />
          <span className="text-xs text-sand/50 dark:text-slate-600">✦ ✦ ✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sand/30 dark:via-slate-700/30 to-transparent" />
        </div>
      );
      continue;
    }

    if (trimmed === '') {
      flushList();
      if (i > 0 && lines[i - 1].trim() !== '') {
        elements.push(<div key={`spacer-${i}`} className="h-2" />);
      }
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.replace(/^[-•]\s+/, '');
      const emoji = bulletEmojis[listItems.length % bulletEmojis.length];
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed flex items-baseline gap-2">
          <span className="shrink-0 w-4 text-center text-gold dark:text-amber-400">{emoji}</span>
          <span>{renderCode(content)}</span>
        </li>
      );
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+[.)]\s+/, '');
      listOrdered = true;
      listItems.push(
        <li key={`ordered-${i}`} className="leading-relaxed flex items-baseline gap-2">
          <span className="shrink-0 w-5 text-right text-xs font-bold text-amber-500 dark:text-amber-400 tabular-nums">{listItems.length + 1}.</span>
          <span>{renderCode(content)}</span>
        </li>
      );
      continue;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-navy dark:text-slate-100 mt-3 mb-1.5 pl-0 border-l-[3px] border-gold/60 dark:border-gold/50 pl-3 flex items-center gap-2">
          <span className="text-gold-dark dark:text-gold">🔹</span>
          <span>{renderCode(trimmed.slice(4))}</span>
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-navy dark:text-slate-100 mt-4 mb-1.5 pl-0 border-l-[3px] border-gold dark:border-gold pl-3 flex items-center gap-2.5">
          <span className="text-gold-dark dark:text-gold">📖</span>
          <span>{renderCode(trimmed.slice(3))}</span>
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-navy dark:text-slate-100 mt-4 mb-2 pl-0 border-l-[3px] border-gold dark:border-gold pl-3 flex items-center gap-2.5">
          <span className="text-gold-dark dark:text-gold">🎯</span>
          <span>{renderCode(trimmed.slice(2))}</span>
        </h1>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className={`text-sm leading-relaxed ${i > 0 && lines[i - 1].trim() !== '' ? 'mt-2' : ''} ${isUser ? 'text-white/95' : 'text-navy/85 dark:text-slate-200/90'}`}>
        {renderCode(trimmed)}
      </p>
    );
  }
  flushList();

  return <>{elements}</>;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
          {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-br from-gold to-amber-400 shadow-sm"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
      <span className="text-xs text-navy/40 ml-1 font-medium">🤔 TutBot is thinking...</span>
    </div>
  );
}

export function AIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(() => localStorage.getItem('tutbot.conversation_id'));
  const [messages, setMessages] = useState<AiMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [landmarkNames, setLandmarkNames] = useState<{ id: string; name: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ data: { id: string; name: string }[] }>('/landmarks/brief').then((res) => setLandmarkNames(res.data)).catch(() => {});
    localStorage.removeItem('tutbot.conversation_ids');
  }, []);

  const persistId = (id: string | null) => {
    if (id) localStorage.setItem('tutbot.conversation_id', id);
    else localStorage.removeItem('tutbot.conversation_id');
    setConversationId(id);
  };

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const gid = getGuestId();
      const opts = !getAuthToken() ? { anonymous: true as const, headers: gid ? { 'X-Guest-Id': gid } as Record<string, string> : undefined } : undefined;
      const res = await api.get<{ data: { role: string; content: string }[] }>(`/ai/conversations/${convId}/messages`, opts);
      const msgs: AiMessage[] = res.data.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      if (msgs.length === 0) msgs.push(WELCOME);
      setMessages(msgs);
      setConversations((prev) => {
        if (prev.some((c) => c.id === convId)) return prev;
        const firstUser = res.data.find((m) => m.role === 'user');
        return [{ id: convId, title: 'Chat', last_message: firstUser?.content ?? null, created_at: '', updated_at: new Date().toISOString() }, ...prev];
      });
    } catch {
      setMessages([WELCOME]);
    }
  }, []);

  useEffect(() => {
    if (conversationId) loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, isSending]);

  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (!isOpen) { setShowSidebar(false); return; }
    const fetchConvs = async () => {
      try {
        if (isAuthenticated) {
          const res = await api.get<{ data: ConversationListItem[] }>('/ai/conversations');
          setConversations(res.data);
        } else {
          const gid = getGuestId();
          if (!gid) { setConversations([]); return; }
          const res = await api.get<{ data: ConversationListItem[] }>(`/ai/conversations?guest_id=${gid}${conversationId ? `&current_id=${conversationId}` : ''}`, { anonymous: true, headers: { 'X-Guest-Id': gid } });
          setConversations(res.data);
        }
      } catch { /* keep existing */ }
    };
    fetchConvs();
  }, [isOpen, isAuthenticated]);

  const conversationMessages = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  const startNewChat = () => {
    persistId(null);
    setMessages([WELCOME]);
    setShowSidebar(false);
  };

  const switchConversation = async (id: string) => {
    persistId(id);
    setShowSidebar(false);
    loadMessages(id);
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const gid = getGuestId();
      const opts = !getAuthToken() ? { anonymous: true as const, headers: gid ? { 'X-Guest-Id': gid } as Record<string, string> : undefined } : undefined;
      await api.delete(`/ai/conversations/${id}`, opts);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) startNewChat();
    } catch {}
  };

  const afterSend = useCallback((response: AiChatResponse) => {
    persistId(response.conversation_id);
    setMessages((prev) => [...prev, response.message]);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === response.conversation_id);
      if (exists) {
        return prev.map((c) => c.id === response.conversation_id
          ? { ...c, last_message: response.message.content.slice(0, 80), updated_at: new Date().toISOString() }
          : c
        );
      }
      const title = response.message.content ? response.message.content.split('\n')[0].replace(/[*#_\-•]+/g, '').trim().slice(0, 35) : 'Chat';
      return [{ id: response.conversation_id, title, last_message: response.message.content.slice(0, 80), created_at: '', updated_at: new Date().toISOString() }, ...prev];
    });
  }, [isAuthenticated]);

  const guestId = useMemo(() => !getAuthToken() ? ensureGuestId() : null, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsSending(true);
    try {
      const response = await api.post<AiChatResponse>('/ai/chat', {
        conversation_id: conversationId,
        messages: [...conversationMessages, { role: 'user', content: trimmed }],
        ...(guestId ? { guest_id: guestId } : {}),
      });
      afterSend(response);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I could not reach the AI service just now. Please try again in a moment.' }]);
    } finally { setIsSending(false); }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (isSending) return;
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: action.prompt }]);
    try {
      const response = await api.post<AiChatResponse>('/ai/chat', {
        conversation_id: conversationId,
        messages: [...conversationMessages, { role: 'user', content: action.prompt }],
        quick_action: action.key,
        ...(guestId ? { guest_id: guestId } : {}),
      });
      afterSend(response);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I could not reach the AI service just now. Please try again in a moment.' }]);
    } finally { setIsSending(false); }
  };

  const scanMessageForLandmarks = useCallback((content: string): AiSuggestion[] => {
    if (landmarkNames.length === 0) return [];
    const lower = content.toLowerCase();
    const found: AiSuggestion[] = [];
    for (const lm of landmarkNames) {
      if (lower.includes(lm.name.toLowerCase())) {
        found.push({ type: 'landmark', id: lm.id, name: lm.name });
      }
    }
    return found.slice(0, 6);
  }, [landmarkNames]);

  const lastUserQuery = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    return (last?.content ?? '').toLowerCase();
  }, [messages]);

  const renderSuggestion = (suggestion: AiSuggestion) => {
    if (suggestion.type === 'landmark') {
      return (
        <motion.button key={suggestion.id} onClick={() => navigate(`/landmark/${suggestion.id}`)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 dark:bg-gold/5 px-2.5 py-1.5 text-xs font-medium text-gold-dark dark:text-gold hover:bg-gold/15 dark:hover:bg-gold/10 transition-colors">
          <Landmark className="w-3.5 h-3.5 shrink-0" />
          {suggestion.name}
        </motion.button>
      );
    }
    if (suggestion.type === 'restaurant') {
      const matches = lastUserQuery.includes(suggestion.name.toLowerCase());
      if (!matches) return null;
      const mapsHref = suggestion.maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.name + ' ' + (suggestion.address ?? ''))}`;
      return (
        <motion.div key={suggestion.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 p-3 text-xs w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" /> {suggestion.name}
          </a>
          {suggestion.description && <p className="mt-1 text-gray-500 dark:text-slate-400 leading-relaxed">{suggestion.description}</p>}
          {suggestion.address && <p className="mt-1 text-gray-400 dark:text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {suggestion.address}</p>}
        </motion.div>
      );
    }
    if (suggestion.type === 'hotel') {
      const matches = lastUserQuery.includes(suggestion.name.toLowerCase());
      if (!matches) return null;
      const mapsHref = suggestion.maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.name + ' ' + (suggestion.address ?? ''))}`;
      return (
        <motion.div key={suggestion.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-xl bg-violet-50 dark:bg-violet-900/10 p-3 text-xs w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1">
            <Hotel className="w-3.5 h-3.5 shrink-0" /> {suggestion.name}
            {suggestion.star_rating && <span className="text-amber-500 text-xs ml-1">{'★'.repeat(Number(suggestion.star_rating))}</span>}
          </a>
          {suggestion.description && <p className="mt-1 text-gray-500 dark:text-slate-400 leading-relaxed">{suggestion.description}</p>}
          {suggestion.address && <p className="mt-1 text-gray-400 dark:text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {suggestion.address}</p>}
          {suggestion.phone && <p className="mt-1 text-gray-400 dark:text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {suggestion.phone}</p>}
        </motion.div>
      );
    }
    return (
      <motion.button key={suggestion.id}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => suggestion.landmark_id && navigate(`/book/${suggestion.landmark_id}`)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-royal/10 dark:bg-royal/5 px-2.5 py-1.5 text-xs font-medium text-royal dark:text-blue-300 hover:bg-royal/15 dark:hover:bg-royal/10 transition-colors">
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        {suggestion.label ?? 'Open booking'}
      </motion.button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-[22rem] sm:w-[26rem] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-white/20 dark:border-slate-700/50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95"
            style={{ height: '560px' }}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-royal via-royal/95 to-royal/90 text-white px-4 py-3.5 flex items-center gap-2 shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,90,0.15),transparent_50%)]" />
              <button onClick={() => setShowSidebar(!showSidebar)}
                className="relative hover:bg-white/15 p-1.5 rounded-xl transition-all active:scale-95"
                title={showSidebar ? 'Back to chat' : 'Conversations'}>
                {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </button>
              <div className="relative flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-amber-400 flex items-center justify-center shadow-md">
                  <Bot className="w-[18px] h-[18px] text-royal" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm tracking-wide block truncate">🤖 TutBot</span>
                  <span className="text-[10px] text-white/60 font-medium">✨ AI Travel Concierge</span>
                </div>
              </div>
              <button onClick={startNewChat}
                className="relative hover:bg-white/15 p-1.5 rounded-xl transition-all active:scale-95"
                title="New chat">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)}
                className="relative hover:bg-white/15 p-1.5 rounded-xl transition-all active:scale-95"
                title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar / Chat area */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Conversation list sidebar */}
              <AnimatePresence>
                {showSidebar && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute inset-0 bg-white/98 dark:bg-slate-900/98 backdrop-blur-sm z-10 overflow-y-auto"
                  >
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between px-2 pb-2 pt-1">
                        <span className="text-[11px] uppercase tracking-widest text-navy/40 dark:text-slate-500 font-semibold">
                          Conversations
                        </span>
                        <span className="text-[10px] text-navy/30 dark:text-slate-600 font-mono">
                          {conversations.length}
                        </span>
                      </div>
                      <motion.button onClick={() => { startNewChat(); setShowSidebar(false); }}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 text-sm text-navy dark:text-slate-200 hover:bg-gold/10 dark:hover:bg-gold/5 border border-transparent hover:border-gold/20 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-gold" />
                        </div>
                        <span className="font-medium">New Chat</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-navy/20 group-hover:text-gold/50 transition-colors" />
                      </motion.button>
                      <div className="h-px bg-gradient-to-r from-transparent via-sand/30 to-transparent my-2" />
                      {conversations.length === 0 && (
                        <p className="text-xs text-navy/40 dark:text-slate-500 text-center py-8 px-4">
                          No conversations yet.<br />Start a new chat!
                        </p>
                      )}
                      {conversations.map((c, i) => (
                        <motion.div key={c.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => switchConversation(c.id)}
                          className={`group flex items-start gap-3 rounded-xl p-2.5 cursor-pointer text-sm transition-all border ${conversationId === c.id ? 'bg-gold/10 border-gold/20 shadow-xs' : 'hover:bg-sand/40 dark:hover:bg-slate-800/50 border-transparent'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${conversationId === c.id ? 'bg-gold/20 text-gold' : 'bg-royal/10 dark:bg-slate-800 text-navy/50 dark:text-slate-400'}`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-navy dark:text-slate-200 truncate font-medium text-sm">{c.title}</p>
                            {c.last_message && <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{c.last_message}</p>}
                            {c.updated_at && <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-0.5">{new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                          </div>
                          <button onClick={(e) => deleteConversation(e, c.id)}
                            className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              {!showSidebar && (
                <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gradient-to-b from-transparent via-transparent to-amber-50/20 dark:to-transparent scrollbar-thin">
                  {messages.map((msg, idx) => (
                    <motion.div key={idx}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-royal to-royal/90 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md'
                        : 'bg-white dark:bg-slate-800/80 text-navy dark:text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-sand/30 dark:border-slate-700/40'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-amber-400 flex items-center justify-center shadow-sm">
                              <Bot className="w-3.5 h-3.5 text-royal" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gold-dark dark:text-gold">🤖 TutBot</span>
                              {msg.source === 'llm' && <span className="text-[10px] text-blue-400 dark:text-blue-400 font-medium">· AI</span>}
                              {msg.source === 'fallback' && <span className="text-[10px] text-gray-400 font-medium">· Offline</span>}
                              {msg.source === 'canned' && <span className="text-[10px] text-emerald-500 font-medium">· Quick</span>}
                            </div>
                          </div>
                        )}
                        <div className={`${msg.role === 'user' ? '' : 'text-sm leading-relaxed'}`}>
                          <FormattedMessage text={msg.content} isUser={msg.role === 'user'} />
                        </div>
                        {msg.role === 'assistant' ? (
                          (() => {
                            const pills = msg.suggestions?.length
                              ? msg.suggestions.map(renderSuggestion).filter(Boolean)
                              : scanMessageForLandmarks(msg.content).map(renderSuggestion).filter(Boolean);
                            return pills.length > 0 ? (
                              <div className="mt-3 pt-2.5 border-t border-sand/30 dark:border-slate-700/40 flex flex-wrap gap-2">
                                {pills}
                              </div>
                            ) : null;
                          })()
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                  {isSending && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start">
                      <div className="max-w-[80%] p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 shadow-sm border border-sand/30 dark:border-slate-700/40 rounded-tl-md">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gold to-amber-400 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-royal" />
                          </div>
                          <span className="text-[11px] font-semibold text-gold-dark dark:text-gold">🤖 TutBot</span>
                        </div>
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}

                  {/* Quick actions */}
                  {messages.length <= 1 && !isSending && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="mt-1">
                      <p className="text-[11px] uppercase tracking-wider text-navy/40 dark:text-slate-500 font-semibold mb-2.5 px-1">
                        Quick Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4)).map((a) => (
                          <motion.button key={a.key} onClick={() => handleQuickAction(a)}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-sand/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm px-3.5 py-2 text-xs font-medium text-navy dark:text-slate-200 hover:bg-gold/10 dark:hover:bg-gold/5 hover:border-gold/30 dark:hover:border-gold/20 transition-all shadow-xs hover:shadow-sm">
                            {quickIconMap[a.key]}
                            {a.label}
                          </motion.button>
                        ))}
                        {!showAllActions && QUICK_ACTIONS.length > 4 && (
                          <button onClick={() => setShowAllActions(true)}
                            className="inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-medium text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-200 hover:bg-sand/30 dark:hover:bg-slate-800/40 transition-all">
                            +{QUICK_ACTIONS.length - 4} More
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-sand/30 dark:border-slate-700/30 shrink-0">
              <div className="flex gap-2.5 items-center">
                <div className="flex-1 relative">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="💬 Ask TutBot anything..."
                    className="w-full bg-sand/40 dark:bg-slate-800/60 border border-sand/60 dark:border-slate-700/60 text-navy dark:text-slate-200 placeholder:text-navy/35 dark:placeholder:text-slate-500 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all" />
                </div>
                <motion.button onClick={handleSend} disabled={isSending || !input.trim()}
                  whileTap={{ scale: 0.9 }}
                  className="bg-gradient-to-br from-gold to-amber-500 text-white p-2.5 rounded-2xl hover:shadow-md hover:from-gold/90 hover:to-amber-500/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none shrink-0">
                  <Send className="w-[18px] h-[18px]" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-royal to-royal/80 text-gold rounded-full shadow-lg shadow-royal/25 hover:shadow-xl hover:shadow-royal/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 border-2 border-gold/20 group">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(212,168,90,0.2),transparent_70%)]" />
        <Bot className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform duration-300" />
      </motion.button>
    </>
  );
}
