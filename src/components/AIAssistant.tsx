import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
  {
    role: 'bot',
    text: 'Welcome to TUTBOT! I am Tut-Assistant. How can I help you plan your Egyptian adventure today?'
  }]
  );
  const [input, setInput] = useState('');
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
    ...prev,
    {
      role: 'user',
      text: input
    }]
    );
    const userText = input.toLowerCase();
    setInput('');
    setTimeout(() => {
      let botReply =
      'I can help you with that! Egypt has many wonderful places to explore.';
      if (userText.includes('budget')) {
        botReply =
        'For a budget-friendly trip, I recommend exploring Islamic Cairo and taking a train to Luxor. Many temples have very affordable entry fees!';
      } else if (userText.includes('beach') || userText.includes('sea')) {
        botReply =
        "If you're looking for beaches, Sharm El-Sheikh or Dahab on the Red Sea are perfect for diving and relaxation.";
      } else if (userText.includes('history') || userText.includes('pharaoh')) {
        botReply =
        "For history lovers, a Nile cruise from Luxor to Aswan is a must. You'll see the Valley of the Kings, Karnak, and Philae Temple.";
      } else if (userText.includes('community')) {
        botReply =
        "Our Community page lets you share your trips and see stories from other travelers. It's a great way to find inspiration!";
      } else if (userText.includes('help')) {
        botReply =
        'You can find answers to common questions on our Help page, or send a message to our support team directly from there.';
      } else if (userText.includes('about')) {
        botReply =
        'TUTBOT was created to blend cutting-edge AI with millennia of history, making Egyptian travel accessible and intelligent.';
      } else if (userText.includes('badges')) {
        botReply =
        "You earn badges by exploring! Visit 5 archaeological sites to get the 'Pharaoh Explorer' badge, or take a Nile cruise for the 'Nile Wanderer' badge.";
      } else if (userText.includes('family')) {
        botReply =
        'For a family trip, I highly recommend Hurghada for its kid-friendly resorts and water parks, combined with a short trip to Luxor to see the temples.';
      } else if (userText.includes('romantic')) {
        botReply =
        'A sunset felucca ride in Aswan or a hot air balloon flight over Luxor at dawn are incredibly romantic experiences.';
      } else if (userText.includes('adventure')) {
        botReply =
        'For adventure, try a desert safari in the White Desert, or go scuba diving in the Blue Hole near Dahab!';
      }
      setMessages((prev) => [
      ...prev,
      {
        role: 'bot',
        text: botReply
      }]
      );
    }, 1000);
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
              {messages.map((msg, idx) =>
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
                  <div
                className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-royal text-white rounded-tr-sm' : 'bg-white dark:bg-slate-card text-navy dark:text-slate-200 shadow-sm border border-sand dark:border-slate-border rounded-tl-sm'}`}>
                
                    {msg.role === 'bot' &&
                <Sparkles className="w-4 h-4 text-gold mb-1 inline-block mr-1" />
                }
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
            )}
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
                className="bg-gold text-white p-2 rounded-xl hover:bg-gold/90 transition-colors">
                
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