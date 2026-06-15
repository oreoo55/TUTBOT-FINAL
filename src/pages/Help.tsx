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
import { api } from '../lib/api';
import { useState, useMemo } from 'react';

type Category = 'booking' | 'account' | 'trips' | 'payment' | 'refunds' | 'tech' | null;

interface FAQ {
  q: string;
  a: string;
  category: Exclude<Category, null>;
}

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formError, setFormError] = useState('');

  const categories = [
    { icon: Ticket, title: 'Booking & Tickets', desc: 'How to book, modify, or cancel.', key: 'booking' as const },
    { icon: User, title: 'Account & Profile', desc: 'Manage your details and badges.', key: 'account' as const },
    { icon: Map, title: 'Trips & Itineraries', desc: 'AI planning and saved trips.', key: 'trips' as const },
    { icon: CreditCard, title: 'Payment', desc: 'Methods, currencies, and security.', key: 'payment' as const },
    { icon: RefreshCcw, title: 'Refunds', desc: 'Policies and processing times.', key: 'refunds' as const },
    { icon: Settings, title: 'Technical Support', desc: 'App issues and bug reports.', key: 'tech' as const },
  ];

  const faqs: FAQ[] = [
    { q: 'How does the AI Assistant plan my trip?', a: 'Tut-Assistant uses advanced algorithms to analyze your preferences, budget, and travel dates to suggest optimized itineraries. It considers travel times between landmarks, opening hours, and historical significance to create a seamless experience.', category: 'trips' },
    { q: 'Are the 360° virtual tours free?', a: 'Yes! All basic 360° previews are free to help you decide which landmarks to visit. Premium guided virtual tours with audio commentary are available for a small fee.', category: 'booking' },
    { q: 'How do I earn gamification badges?', a: 'Badges are automatically awarded when you complete specific actions, such as visiting a certain number of archaeological sites, booking a Nile cruise, or leaving helpful reviews for the community.', category: 'account' },
    { q: 'Can I cancel my booking for a full refund?', a: 'Most standard tickets can be cancelled for a full refund up to 24 hours before the scheduled visit. Special events or guided tours may have different policies, which are clearly stated during checkout.', category: 'refunds' },
    { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard encryption and partner with trusted payment gateways. TUTBOT does not store your full credit card details on our servers.', category: 'payment' },
    { q: 'Do I need to print my tickets?', a: 'No, TUTBOT is fully digital. You can show the QR code from your Profile > Current Trips tab directly on your smartphone at the entrance of the landmarks.', category: 'booking' },
    { q: 'How accurate is the weather widget?', a: 'Our weather widget pulls real-time data from reliable meteorological services, providing highly accurate current conditions and short-term forecasts for specific regions in Egypt.', category: 'tech' },
    { q: 'Can I share my itinerary with friends?', a: 'Yes! In the Community tab, you can choose to make your trips public, or you can generate a private shareable link from your Profile to send directly to friends and family.', category: 'trips' },
    { q: 'How does the Discover page map view work?', a: 'The Discover page shows all landmarks on an interactive map with colored markers. You can toggle between grid view and map view, filter by region or category, and click any marker to see landmark details and booking options.', category: 'booking' },
    { q: 'Can I save landmarks to a wishlist?', a: 'Absolutely! Click the heart icon on any landmark card or detail page to add it to your wishlist. You can view all saved landmarks from your Profile under the Wishlist tab for future trip planning.', category: 'account' },
    { q: 'How do I leave a review for a landmark?', a: 'After visiting a landmark, go to its detail page and scroll to the reviews section. You can rate it from 1 to 5 stars and write a detailed review to help other travelers in the community.', category: 'account' },
    { q: 'What payment methods are accepted for bookings?', a: 'We accept credit/debit cards, Vodafone Cash, InstaPay, and cash payments. For card and mobile wallet payments, you may need to upload a receipt screenshot during the booking process for admin verification.', category: 'payment' },
    { q: 'How does the community forum work?', a: 'The Community tab lets you create posts, comment on other travelers\' experiences, and like posts. You can also view the leaderboard to see top contributors ranked by their engagement and helpfulness.', category: 'tech' },
    { q: 'Can I chat with TutBot as a guest?', a: 'Yes! TutBot is available to everyone without signing in. Your conversation will be saved in your browser for the session. Signing in lets you access your chat history across devices and resume past conversations.', category: 'tech' },
    { q: 'How do I view my booking history?', a: 'Go to your Profile and open the Current Trips tab. You\'ll see all your upcoming and past bookings with their confirmation codes, QR codes for entry, and the option to request cancellations.', category: 'booking' },
    { q: 'What happens if an admin updates landmark info?', a: 'Changes made by admins (like updated prices, descriptions, or images) appear automatically on your screen within seconds thanks to live content syncing — no page refresh needed.', category: 'tech' },
    { q: 'How do I switch between light and dark mode?', a: 'Click the sun/moon icon in the top navigation bar to toggle between light and dark themes. Your preference is saved and will persist across visits.', category: 'tech' },
    { q: 'Can I request a cancellation after the 24-hour window?', a: 'Cancellations within 24 hours of the visit date are generally not eligible for a refund, but you can still submit a cancellation request. The admin team will review it on a case-by-case basis.', category: 'refunds' },
    { q: 'How do I reset my password if I forget it?', a: 'On the Login page, click "Forgot password" and enter your email. You\'ll receive a 6-digit verification code. Enter the code, then create a new password to regain access to your account.', category: 'account' },
    { q: 'Are there student or foreigner ticket pricing options?', a: 'Many landmarks offer separate pricing for Egyptians, Egyptian students, foreigners, and foreign students. These details are displayed on each landmark\'s page under the pricing section.', category: 'payment' },
    { q: 'How does the Egypt History timeline feature work?', a: 'The Egypt History page presents a scrollable timeline of major historical periods from ancient to modern Egypt, with key events, pharaohs, and cultural milestones — perfect for trip context.', category: 'trips' },
    { q: 'Can I customize my profile with a photo and bio?', a: 'Yes! From your Profile page, click "Edit Profile" to upload an avatar, add a bio, set your location, and update your display name. Your public profile is visible to the community.', category: 'account' },
    { q: 'How do I contact customer support?', a: 'You can reach us through the Help page contact form, email us at support@tutbot.com, or use the live chat feature via TutBot. Our support team is available 24/7.', category: 'tech' },
    { q: 'What do the XP and levels mean?', a: 'You earn XP by engaging with the platform — booking trips, leaving reviews, and being active in the community. As you accumulate XP, you level up and unlock new badges that showcase your travel expertise.', category: 'account' },
    { q: 'Can I view other travelers\' profiles?', a: 'Yes! Click on any user\'s name or avatar in the community posts or reviews to view their public profile. You can see their bio, badges, level, recent posts, and reviews.', category: 'account' },
    { q: 'How do I get a refund after cancelling?', a: 'When your cancellation is approved (for eligible bookings within the 24-hour window), the refund is processed automatically. The payment status will update to "refunded" in your booking history.', category: 'refunds' },
    { q: 'Is there a penalty for no-show at a landmark?', a: 'If you don\'t show up for a booked visit without cancelling, the booking is marked as completed and no refund is provided. We recommend cancelling in advance if your plans change.', category: 'refunds' },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch = searchQuery === '' ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    setFormError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await api.post('/contact', {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      });
      setFormStatus('success');
      form.reset();
    } catch {
      setFormError('Failed to send message. Please try again.');
      setFormStatus('idle');
    }
  };

  const handleCategoryClick = (key: Category) => {
    setSelectedCategory(selectedCategory === key ? null : key);
    setSearchQuery('');
  };

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-royal pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1539667468225-eebb663053e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
            How can we help you?
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-navy/40 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }}
              placeholder="Search for articles, guides, or FAQs..."
              className="w-full bg-white dark:bg-slate-card rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:ring-4 focus:ring-gold/30 shadow-xl text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400 border border-transparent dark:border-slate-border" />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) =>
          <motion.button
            key={cat.key}
            onClick={() => handleCategoryClick(cat.key)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className={`bg-white dark:bg-slate-card rounded-[20px] p-6 shadow-soft border text-left transition-all ${selectedCategory === cat.key ? 'border-gold ring-2 ring-gold/20' : 'border-sand dark:border-slate-border hover:-translate-y-1 hover:shadow-lg'}`}>
            <div className="w-12 h-12 bg-royal/5 dark:bg-gold/10 rounded-xl flex items-center justify-center text-royal dark:text-gold mb-4">
              <cat.icon className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-navy dark:text-slate-100 mb-2">{cat.title}</h3>
            <p className="text-navy/60 dark:text-slate-400 text-sm">{cat.desc}</p>
          </motion.button>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold mb-4 text-navy dark:text-gold">Frequently Asked Questions</h2>
          <p className="text-navy/70 dark:text-slate-300">Find quick answers to common queries about using TUTBOT.</p>
        </div>

        <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft border border-sand dark:border-slate-border">
          {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) =>
          <FAQItem key={idx} question={faq.q} answer={faq.a} />
          ) :
          <p className="text-center text-navy/60 dark:text-slate-400 py-8">No results found. Try a different search or category.</p>
          }
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-sand/30 dark:bg-slate-card/30 rounded-[30px] p-8 md:p-12 border border-sand dark:border-slate-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-navy dark:text-slate-100 mb-4">Still need help?</h2>
              <p className="text-navy/60 dark:text-slate-300 mb-8">
                Our support team is available 24/7 to assist you with any inquiries or issues you might face during your journey.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-royal/10 rounded-full flex items-center justify-center text-royal dark:text-gold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">Email Support</h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">support@tutbot.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">Live Chat</h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">Available via Tut-Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-card p-4 rounded-2xl shadow-sm border border-sand dark:border-slate-border">
                  <div className="w-12 h-12 bg-royal/10 rounded-full flex items-center justify-center text-royal dark:text-gold">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-navy dark:text-slate-100">Phone Support</h4>
                    <p className="text-sm text-navy/60 dark:text-slate-400">+20 123 456 7890</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border">
              {formStatus === 'success' ?
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-2">Message Sent!</h3>
                <p className="text-navy/60 dark:text-slate-400 mb-6">
                  We've received your inquiry and will get back to you within 24 hours.
                </p>
                <button onClick={() => setFormStatus('idle')} className="text-royal dark:text-gold font-medium hover:underline">
                  Send another message
                </button>
              </motion.div> :

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-6">Send us a message</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">First Name</label>
                    <input required name="first_name" type="text" className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">Last Name</label>
                    <input required name="last_name" type="text" className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">Email Address</label>
                  <input required name="email" type="email" className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">Subject</label>
                  <select name="subject" className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100">
                    <option>Booking Inquiry</option>
                    <option>Technical Support</option>
                    <option>Feedback</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy/70 dark:text-slate-300 mb-1">Message</label>
                  <textarea name="message" required rows={4} className="w-full bg-sand/30 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-none text-navy dark:text-slate-100 dark:placeholder:text-slate-400"></textarea>
                </div>

                {formError &&
                <p className="text-red-500 text-sm text-center">{formError}</p>
                }

                <button type="submit" disabled={formStatus === 'submitting'} className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 transition-colors shadow-glow mt-2 disabled:opacity-70">
                  {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
              }
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
