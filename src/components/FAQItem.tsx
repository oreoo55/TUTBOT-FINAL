import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
interface FAQItemProps {
  question: string;
  answer: string;
}
export function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-sand dark:border-slate-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group">
        
        <span className="font-serif text-lg font-semibold text-navy dark:text-slate-100 group-hover:text-royal dark:group-hover:text-gold transition-colors">
          {question}
        </span>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
          className="w-8 h-8 rounded-full bg-sand/50 dark:bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold/10 dark:group-hover:bg-gold/20 transition-colors flex-shrink-0 ml-4">
          
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
          className="overflow-hidden">
          
            <p className="pb-6 text-navy/70 dark:text-slate-300 leading-relaxed text-sm">
              {answer}
            </p>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}