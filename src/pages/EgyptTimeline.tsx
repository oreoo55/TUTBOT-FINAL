import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Clock, User, Image as ImageIcon, Lightbulb } from 'lucide-react';

interface Event {
  year: string;
  title: string;
  description: string;
}

interface Figure {
  name: string;
  image: string;
  bio: string;
}

interface Era {
  id: string;
  name: string;
  period: string;
  description: string;
  color: string;
  image: string;
  events: Event[];
  figures: Figure[];
  gallery: string[];
}

const proxyImg = (url: string) =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=128&h=128&fit=cover`;

const eras: Era[] = [
  {
    id: 'pharaonic',
    name: 'Pharaonic Era',
    period: 'c. 3100 BCE – 332 BCE',
    description: 'The Pharaonic Era spans over 3,000 years of ancient Egyptian civilization, beginning with the unification of Upper and Lower Egypt under King Narmer (Menes) around 3100 BCE. This period saw the construction of the Great Pyramids, the development of hieroglyphic writing, and the rise and fall of mighty dynasties. It is divided into the Old Kingdom (age of pyramid building), Middle Kingdom (period of reunification and literature), and New Kingdom (era of empire and monumental temples).',
    color: '#D4AF37',
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80',
    events: [
      { year: 'c. 3100 BCE', title: 'Unification of Egypt', description: 'King Narmer (Menes) unites Upper and Lower Egypt, establishing the first dynasty and founding Memphis as the capital.' },
      { year: 'c. 2686 BCE', title: 'Old Kingdom Begins', description: 'The Third Dynasty ushers in the age of pyramid building, beginning with Djoser\'s Step Pyramid at Saqqara, the first colossal stone monument.' },
      { year: 'c. 2580 BCE', title: 'Great Pyramid of Giza', description: 'Pharaoh Khufu (Cheops) commissions the Great Pyramid, which remains the tallest man-made structure for over 3,800 years.' },
      { year: 'c. 2055 BCE', title: 'Middle Kingdom', description: 'Mentuhotep II reunites Egypt after a period of fragmentation, ushering in a golden age of literature, art, and trade.' },
      { year: 'c. 1550 BCE', title: 'New Kingdom Begins', description: 'Ahmose I expels the Hyksos and founds the 18th Dynasty, marking the start of Egypt\'s imperial age.' },
      { year: 'c. 1479 BCE', title: 'Hatshepsut\'s Reign', description: 'One of Egypt\'s most successful pharaohs, Hatshepsut rules as a woman king, expanding trade and commissioning magnificent architecture.' },
      { year: 'c. 1332 BCE', title: 'Tutankhamun', description: 'The boy king ascends the throne at age nine. His nearly intact tomb, discovered in 1922, becomes the most famous archaeological find in history.' },
      { year: 'c. 1279 BCE', title: 'Ramesses II', description: 'Ramesses the Great rules for 66 years, building more monuments than any other pharaoh, including Abu Simbel and the Ramesseum.' },
      { year: 'c. 332 BCE', title: 'Alexander the Great', description: 'Alexander the Great conquers Egypt, ending the Pharaonic Era and beginning the Greek Ptolemaic dynasty.' },
    ],
    figures: [
      { name: 'Narmer (Menes)', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/d/d8/Narmer_Palette_serpopard_side.jpg'), bio: 'First pharaoh to unite Upper and Lower Egypt, founder of the First Dynasty and the city of Memphis.' },
      { name: 'Hatshepsut', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/4/4b/Hatshepsut-Base_LAM_Musee_du_Caire.jpg'), bio: 'One of the most successful female pharaohs who reigned for over 20 years, focusing on trade and monumental building.' },
      { name: 'Ramesses II', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/1/1c/Ramesses_II_at_Memphis_%28crop%29.jpg'), bio: 'Known as Ramesses the Great, he was the most powerful pharaoh of the New Kingdom, ruling for 66 years and fathering over 100 children.' },
      { name: 'Tutankhamun', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/5/5b/CairoEgMuseumTaaMaskMostlyPhotographed.jpg'), bio: 'The boy king whose intact tomb was discovered in 1922, giving the world an unprecedented glimpse into ancient Egyptian royalty.' },
      { name: 'Imhotep', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/6/65/Imhotep_Statuette_LACMA.jpg'), bio: 'The world\'s first documented architect, engineer, and physician. He designed the Step Pyramid of Djoser and was later deified.' },
    ],
    gallery: [
      'https://www.egypttoursportal.com/images/2021/04/Paintings-in-Ancient-Egypt-Egypt-Tours-Portal.jpg',
      'https://www.egypttoursportal.com/images/2024/04/Avenue-of-Ram-headed-Sphinxes-and-the-Wall-of-Karnak-Temple-Ancient-Egyptian-Architecture-Egypt-Tours-Portal.jpg',
      'https://cdn.britannica.com/49/189749-050-EDADDEC0/Great-Temple-of-Ramses-II-temples-larger.jpg',
      'https://www.egypttoursgate.com/uploads/article/architecture-in-ancient-egyptian.jpg',
    ],
  },
  {
    id: 'greco-roman',
    name: 'Greco-Roman Era',
    period: '332 BCE – 641 CE',
    description: 'Following Alexander the Great\'s conquest in 332 BCE, Egypt entered a new era under the Ptolemaic dynasty — a fusion of Greek and Egyptian cultures. The city of Alexandria became the intellectual capital of the ancient world, home to the Great Library and the Lighthouse of Alexandria. Cleopatra VII, the last active ruler, famously allied with Julius Caesar and Mark Antony. After her defeat, Egypt became a Roman province in 30 BCE, remaining under Roman and later Byzantine rule until the Arab conquest in 641 CE.',
    color: '#4A90D9',
    image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80',
    events: [
      { year: '332 BCE', title: 'Alexander Conquers Egypt', description: 'Alexander the Great enters Egypt without resistance, is proclaimed pharaoh, and founds the city of Alexandria, which becomes a center of learning and culture.' },
      { year: '305 BCE', title: 'Ptolemaic Dynasty', description: 'Ptolemy I Soter, one of Alexander\'s generals, establishes the Ptolemaic dynasty, ruling Egypt for nearly 300 years.' },
      { year: 'c. 280 BCE', title: 'Library of Alexandria', description: 'The Great Library of Alexandria is established, becoming the largest and most significant library of the ancient world, housing hundreds of thousands of scrolls.' },
      { year: 'c. 100 BCE', title: 'Cleopatra VII', description: 'Cleopatra VII, the last active pharaoh, is born. She would become one of history\'s most iconic figures, known for her intelligence, political acumen, and alliances with Rome.' },
      { year: '30 BCE', title: 'Roman Annexation', description: 'After Cleopatra\'s death, Egypt becomes a Roman province, serving as the empire\'s breadbasket and a vital source of grain for Rome.' },
      { year: 'c. 100 CE', title: 'Christianity in Egypt', description: 'Christianity spreads to Egypt, traditionally brought by Saint Mark. Egypt becomes a major center of early Christian thought and monasticism.' },
    ],
    figures: [
      { name: 'Alexander the Great', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/e/e1/Alexander_the_Great_mosaic_%28cropped%29.jpg'), bio: 'Macedonian king who conquered Egypt in 332 BCE and founded Alexandria, one of history\'s greatest cities.' },
      { name: 'Cleopatra VII', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/3/3e/Kleopatra-VII.-Altes-Museum-Berlin1.jpg'), bio: 'The last active ruler of Ptolemaic Egypt, renowned for her political brilliance, multilingualism, and dramatic alliances with Rome.' },
      { name: 'Ptolemy I Soter', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/0/03/Ptolemy_I_Soter_Louvre_Ma849.jpg'), bio: 'Founder of the Ptolemaic dynasty, general under Alexander, who established Alexandria as a cultural and intellectual hub.' },
      { name: 'Hypatia', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/5/55/Hypatia_%28Diogenes%29.jpg'), bio: 'Renowned mathematician, astronomer, and philosopher of Alexandria. One of the first recorded female scholars in history.' },
    ],
    gallery: [
      'https://www.egypttoursportal.com/images/2025/07/Greco-Roman-Rule-in-Egypt-Egypt-Tours-Portal_1.jpg',
      'https://hurghadalovers.com/wp-content/uploads/2022/10/Greek-Roman-era-of-ancient-Egypt-332-BC-396-AD-facts-and-history-of-the-Roman-Empire.jpg',
      'https://shabiba.eu-central-1.linodeobjects.com/2019/04/23/1022498.jpg',
      'https://res.cloudinary.com/tourhq/image/upload/c_fill,f_auto,fl_progressive,g_auto,h_900,q_auto:best,w_1800/dsklkjj7hgw5vmbkz9io',
    ],
  },
  {
    id: 'coptic',
    name: 'Coptic & Byzantine Era',
    period: 'c. 100 CE – 641 CE',
    description: 'The Coptic Era represents Egypt\'s Christian heritage, beginning with the arrival of Saint Mark around 42 CE. By the 3rd century, Christianity had deeply rooted in Egyptian society despite periods of Roman persecution. The Coptic Church, one of the oldest Christian denominations, developed its own language, art, and monastic tradition. Egypt became a center of Christian theology, producing influential figures like Saint Anthony (father of monasticism) and Saint Athanasius. The era ended with the Arab conquest in 641 CE, but the Coptic community remains a vibrant part of Egypt to this day.',
    color: '#8B4513',
    image: 'https://vagustravelco.com/storage/3392/Samaan-el-Kharaz-Monastery-(2).png',
    events: [
      { year: 'c. 42 CE', title: 'Saint Mark in Alexandria', description: 'Saint Mark the Evangelist arrives in Alexandria, traditionally considered the founder of the Coptic Church and the first Pope of Alexandria.' },
      { year: 'c. 250 CE', title: 'Monasticism Begins', description: 'Saint Anthony the Great retreats to the desert, establishing the first Christian monastic community and inspiring countless followers.' },
      { year: '303 CE', title: 'Diocletian Persecution', description: 'Roman Emperor Diocletian unleashes a severe persecution against Christians in Egypt, creating thousands of martyrs. Copts count years from this event (Era of the Martyrs).' },
      { year: 'c. 330 CE', title: 'Pachomian Monasteries', description: 'Saint Pachomius establishes the first cenobitic (communal) monastery at Tabennisi, laying the foundation for organized monasticism worldwide.' },
      { year: '451 CE', title: 'Council of Chalcedon', description: 'The Coptic Church separates from the rest of Christendom after the Council of Chalcedon, following a theological dispute about the nature of Christ.' },
    ],
    figures: [
      { name: 'Saint Mark', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/7/7c/Saint_Mark_the_Evangelist_icon.jpg'), bio: 'The Evangelist who brought Christianity to Egypt and founded the Coptic Church in Alexandria around 42 CE.' },
      { name: 'Saint Anthony', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/4/49/St_Anthony_the_Great_icon.jpg'), bio: 'Regarded as the father of Christian monasticism, he lived as a hermit in Egypt\'s Eastern Desert and attracted followers seeking spiritual guidance.' },
      { name: 'Saint Athanasius', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/6/66/Saint_Athanasius_icon.jpg'), bio: 'The 20th Pope of Alexandria, a leading theologian who defended the divinity of Christ against Arianism at the Council of Nicaea.' },
      { name: 'Pachomius', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/6/6a/Pachomius_Icon.jpg'), bio: 'Founder of cenobitic monasticism, creating the first organized monastery system that influenced Christian monasticism worldwide.' },
    ],
    gallery: [
      'https://smarthistory.org/wp-content/uploads/2021/03/400167001.jpg',
      'https://www.egypttoursplus.com/wp-content/uploads/2025/07/The-Church-of-Saint-George-in-Coptic-Cairo.jpg',
      'https://cdn.britannica.com/52/196952-050-0CDA4C65/Egyptians-hieroglyphics-carvings.jpg',
      'https://www.egypttoursportal.com/images/2025/05/Hanging-Church-In-Coptic-Cairo-Egypt-Tours-Portal.jpg',
    ],
  },
  {
    id: 'islamic',
    name: 'Islamic Era',
    period: '641 CE – 1798 CE',
    description: 'The Islamic Era began with the Arab conquest led by Amr ibn al-As in 641 CE, who founded the city of Fustat (now part of Cairo). Egypt became a center of Islamic civilization under successive dynasties — the Umayyads, Abbasids, Tulunids, Fatimids (who founded Cairo in 969 CE), Ayyubids, Mamluks, and Ottomans. Cairo\'s Al-Azhar University, established in 970 CE, is one of the oldest universities in the world. The Mamluk period (1250–1517) saw extraordinary architectural achievements, with countless mosques, madrasas, and fortifications that still define Cairo\'s historic skyline.',
    color: '#2E8B57',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Flickr_-_archer10_%28Dennis%29_-_Egypt-13A-061.jpg',
    events: [
      { year: '641 CE', title: 'Arab Conquest', description: 'Amr ibn al-As leads the Arab Muslim conquest of Egypt, founding Fustat, the first Islamic capital on the Nile near modern Cairo.' },
      { year: '969 CE', title: 'Founding of Cairo', description: 'The Fatimid general Jawhar al-Siqilli establishes the city of Cairo (al-Qahira, "the Victorious") as the new capital, building Al-Azhar Mosque.' },
      { year: '970 CE', title: 'Al-Azhar University', description: 'Al-Azhar Mosque becomes a center of learning, evolving into one of the world\'s oldest continuously operating universities and the premier institution of Islamic scholarship.' },
      { year: '1171 CE', title: 'Saladin & Ayyubids', description: 'Saladin overthrows the Fatimid Caliphate and establishes the Ayyubid dynasty. He builds the Cairo Citadel and fortifies the city against Crusaders.' },
      { year: '1250 CE', title: 'Mamluk Sultanate', description: 'The Mamluks, slave soldiers who became rulers, take power. They defeat the Mongols at Ain Jalut (1260) and usher in a golden age of architecture and trade.' },
      { year: '1517 CE', title: 'Ottoman Conquest', description: 'The Ottoman Empire under Sultan Selim I conquers Egypt, incorporating it into the Ottoman realm. Egypt becomes an Ottoman province ruled by governors (pashas).' },
    ],
    figures: [
      { name: 'Amr ibn al-As', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/2/2b/Amr_ibn_al-As_Mosque.jpg'), bio: 'The Arab general who conquered Egypt in 641 CE, founded the city of Fustat, and established Egypt\'s first mosque (Mosque of Amr ibn al-As).' },
      { name: 'Saladin (Salah ad-Din)', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/4/4c/Saladin_on_camel_%28cropped%29.jpg'), bio: 'Founder of the Ayyubid dynasty, renowned Muslim leader who recaptured Jerusalem and built Cairo\'s Citadel.' },
      { name: 'Al-Muizz li-Din Allah', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/f/fe/Fatimid_caliph_al-muizz.jpg'), bio: 'The fourth Fatimid caliph who moved the caliphate\'s capital to Cairo, commissioning the construction of Al-Azhar Mosque.' },
      { name: 'Sultan Al-Zahir Baybars', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/3/3c/Baibars.jpg'), bio: 'One of the greatest Mamluk sultans, who defeated the Mongols and Crusaders, built schools and mosques, and established a unified postal system.' },
    ],
    gallery: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhzX7mODa6WdqoHxLOOT8YMfg67qpEmSzuew&s',
      'https://www.luxorbookingtours.com/Images/uploads/71d027a3-09e1-42e9-b6ac-e019f96f30ae.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThiIobt3y4FcJDlwf4YuGC1ZtUv7cUjNQauA&s',
      'https://www.exploreegypttours.com/wp-content/uploads/2023/07/Islamic-Cairo-A-Timeless-Journey-through-Egypts-Islamic-Heritage.jpg',
    ],
  },
  {
    id: 'modern',
    name: 'Modern Era',
    period: '1798 CE – Present',
    description: 'The Modern Era of Egypt began with Napoleon Bonaparte\'s campaign in 1798, which shattered Ottoman control and exposed Egypt to European influence. Muhammad Ali Pasha, an Albanian Ottoman commander, took power in 1805 and launched a sweeping modernization program — building a new army, reforming education, and industrializing the economy. The Suez Canal opened in 1869, transforming global trade. Egypt gained formal independence in 1922, witnessed the 1952 Revolution that abolished the monarchy, and became a republic under Gamal Abdel Nasser. Today, Egypt is a vibrant nation of over 100 million people, a cultural and political leader in the Arab world and Africa.',
    color: '#C0392B',
    image: 'https://thinkmarketingmagazine.com/wp-content/uploads/2021/11/TMM-Featured-Image-003-091.png',
    events: [
      { year: '1798 CE', title: 'Napoleon\'s Campaign', description: 'Napoleon Bonaparte invades Egypt, bringing with him a team of scholars (the "savants") who produce the monumental Description de l\'Égypte, sparking Egyptomania in Europe.' },
      { year: '1805 CE', title: 'Muhammad Ali Takes Power', description: 'Muhammad Ali Pasha becomes ruler of Egypt, implementing sweeping reforms in agriculture, industry, military, and education that transform Egypt into a modern state.' },
      { year: '1869 CE', title: 'Suez Canal Opens', description: 'The Suez Canal, built by Ferdinand de Lesseps, opens after 10 years of construction, connecting the Mediterranean and Red Seas and revolutionizing global maritime trade.' },
      { year: '1922 CE', title: 'Independence', description: 'Egypt gains formal independence from Britain, and Sultan Fuad I becomes King. However, British influence continues in military and economic affairs.' },
      { year: '1952 CE', title: 'July Revolution', description: 'The Free Officers Movement, led by Gamal Abdel Nasser, overthrows King Farouk in a bloodless coup, ending the monarchy and establishing a republic.' },
      { year: '1956 CE', title: 'Suez Crisis', description: 'Nasser nationalizes the Suez Canal, triggering a military intervention by Britain, France, and Israel. Egypt emerges politically victorious, cementing Nasser\'s leadership of the Arab world.' },
      { year: '1979 CE', title: 'Peace Treaty with Israel', description: 'President Anwar Sadat signs the Camp David Accords and the Egypt-Israel Peace Treaty, making Egypt the first Arab country to recognize Israel.' },
      { year: '2011 CE', title: 'January 25 Revolution', description: 'Millions of Egyptians protest across the country, leading to the resignation of President Hosni Mubarak after 30 years in power.' },
    ],
    figures: [
      { name: 'Muhammad Ali Pasha', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/5/5e/Muhammad_Ali_Pasha_by_Davis.jpg'), bio: 'Founder of modern Egypt, Albanian-born Ottoman commander who modernized the country\'s military, economy, and education system.' },
      { name: 'Gamal Abdel Nasser', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/5/5e/Nasser_portrait_%28cropped%29.jpg'), bio: 'Second president of Egypt and iconic leader of Arab nationalism who nationalized the Suez Canal and championed anti-colonial movements.' },
      { name: 'Anwar Sadat', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/0/0c/Anwar_Sadat_cropped.jpg'), bio: 'Third president of Egypt who made peace with Israel, earning the Nobel Peace Prize, and launched the economic Open Door policy (Infitah).' },
      { name: 'Saad Zaghloul', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/6/60/Saad_Zaghloul_Pasha.jpg'), bio: 'Nationalist leader and founder of the Wafd Party, who led the 1919 revolution for Egyptian independence from British rule.' },
      { name: 'Naguib Mahfouz', image: proxyImg('https://upload.wikimedia.org/wikipedia/commons/8/89/Naguib_Mahfouz_1955.jpg'), bio: 'Egyptian novelist and Nobel laureate in Literature (1988), best known for his Cairo Trilogy, which captures the social changes of 20th-century Egypt.' },
    ],
    gallery: [
      'https://orascom.com/wp-content/uploads/DJI_0071.00_00_00_12.Still001-1-1366x768.jpg',
      'https://www.heidelbergmaterials.com/sites/default/files/2026-03/Metro.jpg',
      'https://egyptianstreets.com/wp-content/uploads/2024/02/suez-canal-gettyimages-1183013061.jpg',
      'https://www.arabcont.com/Images/ProjectImage/AlFatahAlAleemMousque01.jpg',
    ],
  },
];

const triviaFacts: string[] = [
  'The Great Pyramid of Giza was the tallest man-made structure in the world for over 3,800 years.',
  'Ancient Egyptians invented the 365-day calendar, with 12 months of 30 days plus 5 extra days.',
  'Egyptian women had legal and economic rights equal to men — they could own property, divorce, and sign contracts.',
  'Both men and women in ancient Egypt wore makeup, including kohl eyeliner, believed to have medicinal and protective properties.',
  'Cats were considered sacred in ancient Egypt and were often mummified alongside their owners.',
  'The ancient Egyptians used a form of toothpaste made from crushed eggshells and ox hoof powder.',
  'Egypt\'s Nile River is the longest river in the world, stretching approximately 6,650 kilometers (4,130 miles).',
  'The Library of Alexandria was one of the largest and most significant libraries of the ancient world, housing up to 400,000 scrolls.',
  'Tutankhamun\'s tomb contained over 5,000 artifacts, including his famous gold burial mask weighing 11 kilograms of solid gold.',
  'The Sphinx is the largest monolithic statue in the world, carved from a single ridge of limestone.',
  'Ancient Egyptians used hieroglyphs — a writing system with over 700 different symbols combining logographic and alphabetic elements.',
  'The mummification process took 70 days and involved removing the internal organs except for the heart, which was considered the seat of the soul.',
  'Cairo is known as "the City of a Thousand Minarets" due to its numerous Islamic-era mosques.',
  'The Cairo Citadel, built by Saladin, was the seat of Egyptian government for nearly 700 years.',
  'Al-Azhar University in Cairo, founded in 970 CE, is one of the oldest universities in the world still operating.',
  'Egypt\'s Western Desert contains the Great Sand Sea, with dunes reaching heights of up to 140 meters.',
  'The Pharos of Alexandria was one of the Seven Wonders of the Ancient World, standing approximately 100 meters tall.',
  'Ancient Egyptian doctors performed complex surgeries including brain surgery and setting broken bones, with instruments like scalpels and forceps.',
  'The Rosetta Stone, discovered in 1799, was the key to deciphering Egyptian hieroglyphs, as it contained the same text in Greek, Demotic, and hieroglyphs.',
  'Egypt produces over 70% of the world\'s date crop, with over 14 million date palms across the country.',
];

export function EgyptTimeline() {
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [trivia, setTrivia] = useState('');
  const [showTrivia, setShowTrivia] = useState(false);

  useEffect(() => {
    const idx = Math.floor(Math.random() * triviaFacts.length);
    setTrivia(triviaFacts[idx]);
    const timer = setTimeout(() => setShowTrivia(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedEra(null);
    setGalleryIndex(0);
  }, []);

  const selectEra = useCallback((era: Era) => {
    setSelectedEra(era);
    setGalleryIndex(0);
  }, []);

  const nextGallery = useCallback(() => {
    if (!selectedEra) return;
    setGalleryIndex(prev => (prev + 1) % selectedEra.gallery.length);
  }, [selectedEra]);

  const prevGallery = useCallback(() => {
    if (!selectedEra) return;
    setGalleryIndex(prev => (prev - 1 + selectedEra.gallery.length) % selectedEra.gallery.length);
  }, [selectedEra]);

  return (
    <div className="min-h-screen bg-offwhite dark:bg-midnight pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
            History of Egypt
          </h1>
          <p className="text-lg text-navy/60 dark:text-slate-400 max-w-3xl mx-auto">
            Explore the rich tapestry of Egyptian civilization — from the dawn of the pharaohs to the modern republic.
            Click on any era to discover its stories, people, and monuments.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gold/30 dark:bg-gold/20 -translate-x-1/2 hidden md:block" />

          <div className="space-y-8 md:space-y-16">
            {eras.map((era, index) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={era.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Card */}
                  <div className={`w-full md:w-[calc(50%-2rem)] ${isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectEra(era)}
                      className="w-full text-left"
                    >
                      <div className="bg-white dark:bg-slate-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-sand dark:border-slate-border group cursor-pointer">
                        <div className="h-48 overflow-hidden">
                          <img
                            src={era.image}
                            alt={era.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: era.color }} />
                            <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100">{era.name}</h3>
                          </div>
                          <p className="text-sm text-navy/50 dark:text-slate-500 mb-2">{era.period}</p>
                          <p className="text-sm text-navy/70 dark:text-slate-300 line-clamp-2">{era.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gold border-4 border-offwhite dark:border-midnight z-10" />

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block w-[calc(50%-2rem)]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Era Detail Modal */}
      <AnimatePresence>
        {selectedEra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm py-8 px-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-white dark:bg-slate-card rounded-3xl shadow-2xl overflow-hidden relative"
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header image */}
              <div className="relative h-56 md:h-72 overflow-hidden">
                <img src={selectedEra.image} alt={selectedEra.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="inline-block w-4 h-4 rounded-full mb-2" style={{ backgroundColor: selectedEra.color }} />
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">{selectedEra.name}</h2>
                  <p className="text-white/70 text-sm mt-1">{selectedEra.period}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Description */}
                <p className="text-navy/70 dark:text-slate-300 leading-relaxed">{selectedEra.description}</p>

                {/* Image Gallery */}
                {selectedEra.gallery.length > 0 && (
                  <div>
                    <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-gold" /> Gallery
                    </h3>
                    <div className="relative rounded-xl overflow-hidden bg-sand/20 dark:bg-slate-border/20">
                      <img
                        src={selectedEra.gallery[galleryIndex]}
                        alt={`${selectedEra.name} gallery ${galleryIndex + 1}`}
                        className="w-full h-64 md:h-80 object-cover transition-all duration-500"
                      />
                      {selectedEra.gallery.length > 1 && (
                        <>
                          <button
                            onClick={prevGallery}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextGallery}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                            {selectedEra.gallery.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setGalleryIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Events */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold" /> Key Historical Events
                  </h3>
                  <div className="space-y-3">
                    {selectedEra.events.map((event, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 p-4 rounded-xl bg-sand/20 dark:bg-slate-border/20 hover:bg-sand/40 dark:hover:bg-slate-border/40 transition-colors"
                      >
                        <span className="shrink-0 w-20 text-sm font-bold text-gold">{event.year}</span>
                        <div>
                          <h4 className="font-semibold text-navy dark:text-slate-100">{event.title}</h4>
                          <p className="text-sm text-navy/60 dark:text-slate-400 mt-0.5">{event.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Historical Figures */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" /> Prominent Historical Figures
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedEra.figures.map((figure, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-4 p-4 rounded-xl bg-sand/20 dark:bg-slate-border/20 hover:bg-sand/40 dark:hover:bg-slate-border/40 transition-colors"
                      >
                        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white bg-gold rounded-full">
                            {figure.name.charAt(0).toUpperCase()}
                          </span>
                          <img
                            src={figure.image}
                            alt={figure.name}
                            className="relative w-full h-full object-cover z-10"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy dark:text-slate-100">{figure.name}</h4>
                          <p className="text-sm text-navy/60 dark:text-slate-400 mt-0.5">{figure.bio}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Did You Know?" Pop-up */}
      <AnimatePresence>
        {showTrivia && trivia && (
          <motion.div
            initial={{ opacity: 0, y: 80, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 80, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-6 right-6 z-40 max-w-sm w-full"
          >
            <div className="bg-white dark:bg-slate-card rounded-2xl shadow-2xl border border-sand dark:border-slate-border overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-navy dark:text-slate-100">Did You Know?</h4>
                    <button
                      onClick={() => setShowTrivia(false)}
                      className="shrink-0 w-6 h-6 rounded-full hover:bg-sand/30 dark:hover:bg-slate-border/30 flex items-center justify-center text-navy/40 dark:text-slate-500 hover:text-navy dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-navy/70 dark:text-slate-300 leading-relaxed">{trivia}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
