import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Ticket,
  User,
  Map,
  CreditCard,
  RefreshCcw,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2 } from
'lucide-react';
import { FAQItem } from '../components/FAQItem';
export function Help() {
  const [formStatus, setFormStatus] = useState<
    'idle' | 'submitting' | 'success'>(
    'idle');
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    setTimeout(() => setFormStatus('success'), 1500);
  };
  const categories = [
  {
    icon: Ticket,
    title: 'Booking & Tickets',
    desc: 'How to book, modify, or cancel.'
  },
  {
    icon: User,
    title: 'Account & Profile',
    desc: 'Manage your details and badges.'
  },
  {
    icon: Map,
    title: 'Trips & Itineraries',
    desc: 'AI planning and saved trips.'
  },
  {
    icon: CreditCard,
    title: 'Payment',
    desc: 'Methods, currencies, and security.'
  },
  {
    icon: RefreshCcw,
    title: 'Refunds',
    desc: 'Policies and processing times.'
  },
  {
    icon: Settings,
    title: 'Technical Support',
    desc: 'App issues and bug reports.'
  }];

  const faqs = [
  {
    q: 'How does the AI Assistant plan my trip?',
    a: 'Tut-Assistant uses advanced algorithms to analyze your preferences, budget, and travel dates to suggest optimized itineraries. It considers travel times between landmarks, opening hours, and historical significance to create a seamless experience.'
  },
  {
    q: 'Are the 360° virtual tours free?',
    a: 'Yes! All basic 360° previews are free to help you decide which landmarks to visit. Premium guided virtual tours with audio commentary are available for a small fee.'
  },
  {
    q: 'How do I earn gamification badges?',
    a: 'Badges are automatically awarded when you complete specific actions, such as visiting a certain number of archaeological sites, booking a Nile cruise, or leaving helpful reviews for the community.'
  },
  {
    q: 'Can I cancel my booking for a full refund?',
    a: 'Most standard tickets can be cancelled for a full refund up to 24 hours before the scheduled visit. Special events or guided tours may have different policies, which are clearly stated during checkout.'
  },
  {
    q: 'Is my payment information secure?',
    a: 'Absolutely. We use industry-standard encryption and partner with trusted payment gateways. TUTBOT does not store your full credit card details on our servers.'
  },
  {
    q: 'Do I need to print my tickets?',
    a: 'No, TUTBOT is fully digital. You can show the QR code from your Profile > Current Trips tab directly on your smartphone at the entrance of the landmarks.'
  },
  {
    q: 'How accurate is the weather widget?',
    a: 'Our weather widget pulls real-time data from reliable meteorological services, providing highly accurate current conditions and short-term forecasts for specific regions in Egypt.'
  },
  {
    q: 'Can I share my itinerary with friends?',
    a: 'Yes! In the Community tab, you can choose to make your trips public, or you can generate a private shareable link from your Profile to send directly to friends and family.'
  }];

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-royal pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1539667468225-eebb663053e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
            
            How can we help you?
          </motion.h1>

          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.1
            }}
            className="relative max-w-2xl mx-auto">
            
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-navy/40 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search for articles, guides, or FAQs..."
              className="w-full bg-white dark:bg-slate-card rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:ring-4 focus:ring-gold/30 shadow-xl text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400 border border-transparent dark:border-slate-border" />
            
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) =>
          <motion.div
            key={idx}
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.2 + idx * 0.1
            }}
            className="bg-white dark:bg-slate-card rounded-[20px] p-6 shadow-soft border border-sand dark:border-slate-border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
            
              <div className="w-12 h-12 bg-royal/5 dark:bg-gold/10 rounded-xl flex items-center justify-center text-royal dark:text-gold mb-4 group-hover:bg-royal dark:group-hover:bg-gold group-hover:text-white transition-colors">
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-navy dark:text-slate-100 mb-2">
                {cat.title}
              </h3>
              <p className="text-navy/60 dark:text-slate-400 text-sm">
                {cat.desc}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold mb-4 text-navy dark:text-gold">
            Frequently Asked Questions
          </h2>
          <p className="text-navy/70 dark:text-slate-300">
            Find quick answers to common queries about using TUTBOT.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft border border-sand dark:border-slate-border">
          {faqs.map((faq, idx) =>
          <FAQItem key={idx} question={faq.q} answer={faq.a} />
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-sand/30 dark:bg-slate-card/30 rounded-[30px] p-8 md:p-12 border border-sand dark:border-slate-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
                Still need help?
              </h2>
              <p className="text-navy/60 dark:text-slate-300 mb-8">
                Our support team is available 24/7 to assist you with any
                inquiries or issues you might face during your journey.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-royal/10 rounded-full flex items-center justify-center text-royal dark:text-gold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">
                      Email Support
                    </h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">
                      support@tutbot.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">
                      Live Chat
                    </h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">
                      Available via Tut-Assistant
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-royal/10 rounded-full flex items-center justify-center text-royal dark:text-gold">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">
                      Phone Support
                    </h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">
                      +20 123 456 7890
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border">
              {formStatus === 'success' ?
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9
                }}
                animate={{
                  opacity: 1,
                  scale: 1
                }}
                className="h-full flex flex-col items-center justify-center text-center py-12">
                
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-navy/60 dark:text-slate-400 mb-6">
                    We've received your inquiry and will get back to you within
                    24 hours.
                  </p>
                  <button
                  onClick={() => setFormStatus('idle')}
                  className="text-royal dark:text-gold font-medium hover:underline">
                  
                    Send another message
                  </button>
                </motion.div> :

              <form onSubmit={handleFormSubmit} className="space-y-4">
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-6">
                    Send us a message
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                      required
                      type="text"
                      className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                      required
                      type="text"
                      className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                    required
                    type="email"
                    className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                  
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100">
                      <option>Booking Inquiry</option>
                      <option>Technical Support</option>
                      <option>Feedback</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">
                      Message
                    </label>
                    <textarea
                    required
                    rows={4}
                    className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-none text-navy dark:text-slate-100 dark:placeholder:text-slate-400">
                  </textarea>
                  </div>

                  <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 transition-colors shadow-glow mt-2 disabled:opacity-70">
                  
                    {formStatus === 'submitting' ?
                  'Sending...' :
                  'Send Message'}
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </section>
    </div>);

}