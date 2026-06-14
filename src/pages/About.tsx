import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Counter } from '../components/Counter';
export function About() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  return (
    <div className="pb-20 overflow-hidden">
      {/* Editorial Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-navy">
        <motion.div
          style={{
            y: y1
          }}
          className="absolute inset-0 z-0 opacity-40">
          
          <img
            src="https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Egypt Landscape"
            className="w-full h-full object-cover" />
          
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-offwhite dark:from-midnight via-navy/50 to-transparent z-10" />

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto mt-20">
          <motion.h1
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 1
            }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            
            Where Ancient Meets <br />
            <span className="text-gold italic">Intelligent</span>
          </motion.h1>
          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 1,
              delay: 0.2
            }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            
            We are redefining how the world experiences Egypt by blending
            cutting-edge AI with millennia of history.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{
              opacity: 0,
              x: -30
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.8
            }}>
            
            <h2 className="text-4xl font-serif font-bold mb-6 text-navy dark:text-gold">
              Our Mission
            </h2>
            <div className="w-20 h-1 bg-gold mb-8" />
            <p className="text-lg leading-relaxed mb-6 text-navy/80 dark:text-slate-200">
              TUTBOT was founded with a singular vision: to make the wonders of
              Egypt accessible, understandable, and deeply personal for every
              traveler.
            </p>
            <p className="text-lg leading-relaxed text-navy/80 dark:text-slate-200">
              We believe that exploring history shouldn't be a logistical
              challenge. By leveraging artificial intelligence, immersive 360°
              previews, and a passionate community, we've built a platform that
              acts as your personal Egyptologist, travel agent, and local guide
              all in one.
            </p>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              x: 30
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.8
            }}
            className="relative h-[500px] rounded-[30px] overflow-hidden shadow-2xl">
            
            <img
              src="https://images.unsplash.com/photo-1539667468225-eebb663053e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Pyramids"
              className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 border-4 border-gold/30 rounded-[30px] m-4 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-20 bg-royal relative overflow-hidden">
        <motion.div
          style={{
            y: y2
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
            {
              value: 50,
              suffix: 'K+',
              label: 'Happy Travelers'
            },
            {
              value: 200,
              suffix: '+',
              label: 'Curated Landmarks'
            },
            {
              value: 25,
              suffix: '',
              label: 'Cities Covered'
            },
            {
              value: 4.9,
              suffix: '/5',
              label: 'Average Rating'
            }].
            map((stat, idx) =>
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y: 20
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: idx * 0.1
              }}>
              
                <div className="text-4xl md:text-5xl font-serif font-bold text-gold mb-2">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4 text-navy dark:text-gold">
            Our Journey
          </h2>
          <p className="text-navy/70 dark:text-slate-300">
            How TUTBOT evolved from an idea to a revolution in travel.
          </p>
        </div>

        <div className="relative border-l-2 border-sand ml-4 md:mx-auto md:border-l-0">
          {/* Center line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-sand -translate-x-1/2" />

          {[
          {
            year: '2023',
            title: 'The Genesis',
            desc: 'TUTBOT was conceived during a trip to Luxor when our founders realized the need for a smarter travel companion.'
          },
          {
            year: '2024',
            title: 'AI Integration',
            desc: 'Launched the first version of Tut-Assistant, capable of planning personalized itineraries.'
          },
          {
            year: '2025',
            title: 'Virtual Reality',
            desc: 'Partnered with local authorities to map 50+ historical sites in stunning 360° detail.'
          },
          {
            year: '2026',
            title: 'Community Launch',
            desc: 'Introduced gamification and the traveler community, connecting explorers worldwide.'
          }].
          map((item, idx) =>
          <motion.div
            key={idx}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true,
              margin: '-100px'
            }}
            className={`relative flex flex-col md:flex-row gap-8 mb-12 last:mb-0 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
            
              {/* Dot */}
              <div className="absolute left-[-21px] md:left-1/2 md:-translate-x-1/2 w-10 h-10 bg-offwhite border-4 border-gold rounded-full flex items-center justify-center z-10 shadow-sm">
                <div className="w-3 h-3 bg-royal rounded-full" />
              </div>

              <div className="ml-8 md:ml-0 md:w-1/2 md:px-12 flex flex-col justify-center">
                <div
                className={`bg-white dark:bg-slate-card p-6 rounded-[20px] shadow-soft border border-sand dark:border-slate-border ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                
                  <span className="text-gold font-bold text-sm mb-2 block">
                    {item.year}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-navy/60 dark:text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
              <div className="hidden md:block md:w-1/2" />
            </motion.div>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-sand/30 dark:bg-slate-card/30 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4 text-navy dark:text-gold">
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            {
              icon: Heart,
              title: 'Passion for Heritage',
              desc: "We respect and promote the preservation of Egypt's unparalleled historical legacy."
            },
            {
              icon: Sparkles,
              title: 'Intelligent Innovation',
              desc: 'We continuously push the boundaries of technology to enhance the human experience.'
            },
            {
              icon: Shield,
              title: 'Trust & Transparency',
              desc: 'We provide honest recommendations, clear pricing, and secure bookings.'
            }].
            map((value, idx) =>
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y: 20
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: idx * 0.1
              }}
              className="bg-white dark:bg-slate-card rounded-[25px] p-8 text-center shadow-soft border border-sand dark:border-slate-border">
              
                <div className="w-16 h-16 bg-royal rounded-full flex items-center justify-center mx-auto mb-6 text-gold shadow-glow">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-3">
                  {value.title}
                </h3>
                <p className="text-navy/60 dark:text-slate-400 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          whileInView={{
            opacity: 1,
            scale: 1
          }}
          viewport={{
            once: true
          }}
          className="glass-dark rounded-[30px] p-12 relative overflow-hidden border border-white/10">
          
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1572252009286-268acec5ca0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
          <div className="relative z-10">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">
              Ready to explore?
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Join thousands of travelers who have already discovered the magic
              of Egypt with TUTBOT.
            </p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 bg-gold text-white px-8 py-4 rounded-xl font-medium hover:bg-gold/90 transition-colors shadow-glow text-lg">
              
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>);

}