import { Axiom, Fact } from '../types/db';

// Axioms for the Explore flow (Non-Muslims)
// Scientific and logical proofs of the Quran's divine origin
export const axioms: Axiom[] = [
  {
    id: 'universe-expansion',
    title: 'The Expanding Universe',
    category: 'cosmology',
    quranicReference: {
      surah: 51,
      ayah: 47,
      arabicText: 'وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
      translation: 'And the heaven We constructed with strength, and indeed, We are [its] expander.'
    },
    scientificEvidence: 'Edwin Hubble discovered in 1929 that galaxies are moving away from each other, proving the universe is expanding. This is now fundamental to cosmology.',
    discoveryYear: 1929,
    quranYear: 610,
    sources: ['https://www.nasa.gov/universe/the-universe-is-expanding-faster-than-it-should-be/'],
    difficulty: 'easy'
  },
  {
    id: 'mountain-roots',
    title: 'Mountains Have Deep Roots',
    category: 'geology',
    quranicReference: {
      surah: 78,
      ayah: 7,
      arabicText: 'وَالْجِبَالَ أَوْتَادًا',
      translation: 'And the mountains as stakes (pegs).'
    },
    scientificEvidence: 'Modern geology confirms mountains have deep roots extending into the Earth\'s crust, like stakes/pegs. This was only discovered in the 19th century through seismic studies.',
    discoveryYear: 1865,
    quranYear: 610,
    sources: ['https://www.usgs.gov/faqs/how-are-mountains-formed'],
    difficulty: 'easy'
  },
  {
    id: 'embryo-stages',
    title: 'Embryonic Development Stages',
    category: 'biology',
    quranicReference: {
      surah: 23,
      ayah: 14,
      arabicText: 'ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً فَخَلَقْنَا الْمُضْغَةَ عِظَامًا فَكَسَوْنَا الْعِظَامَ لَحْمًا',
      translation: 'Then We made the sperm-drop into a clinging clot, and We made the clot into a lump, and We made the lump into bones, and We covered the bones with flesh.'
    },
    scientificEvidence: 'Modern embryology confirms this exact sequence: fertilization, implantation (clinging), the chewed-like appearance of the embryo, bone formation, then muscle development around the bones.',
    discoveryYear: 1940,
    quranYear: 610,
    sources: ['https://embryology.med.unsw.edu.au/embryology/index.php/Main_Page'],
    difficulty: 'medium'
  },
  {
    id: 'two-seas',
    title: 'The Barrier Between Two Seas',
    category: 'geology',
    quranicReference: {
      surah: 55,
      ayah: 19,
      arabicText: 'مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَا يَبْغِيَانِ',
      translation: 'He released the two seas, meeting [side by side]; Between them is a barrier [so] neither of them transgresses.'
    },
    scientificEvidence: 'Oceanography has discovered that where fresh water and salt water meet (like river mouths), there is a distinct barrier called a halocline that prevents them from mixing immediately due to density differences.',
    discoveryYear: 1873,
    quranYear: 610,
    sources: ['https://oceanservice.noaa.gov/facts/estuaries.html'],
    difficulty: 'easy'
  },
  {
    id: 'iron-from-space',
    title: 'Iron Sent Down From the Sky',
    category: 'cosmology',
    quranicReference: {
      surah: 57,
      ayah: 25,
      arabicText: 'وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ',
      translation: 'And We sent down iron, wherein is great military might and benefits for the people.'
    },
    scientificEvidence: 'Astrophysics confirms that iron cannot form in our sun—it requires a supernova explosion. All iron on Earth literally came from outer space via meteorites billions of years ago.',
    discoveryYear: 1950,
    quranYear: 610,
    sources: ['https://www.nasa.gov/feature/goddard/2016/nasas-fermi-shows-where-supernovas-forged-iron'],
    difficulty: 'medium'
  },
  {
    id: 'fingerprints',
    title: 'Unique Fingerprints',
    category: 'biology',
    quranicReference: {
      surah: 75,
      ayah: 4,
      arabicText: 'بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ',
      translation: 'Yes, We are able to put together in perfect order the very tips of his fingers.'
    },
    scientificEvidence: 'Fingerprint uniqueness was only scientifically established in 1892 by Sir Francis Galton. Each person\'s fingerprints are completely unique—even identical twins have different fingerprints.',
    discoveryYear: 1892,
    quranYear: 610,
    sources: ['https://www.fbi.gov/services/laboratory/biometric-analysis/fingerprints-and-other-biometrics'],
    difficulty: 'easy'
  },
  {
    id: 'sun-orbit',
    title: 'The Sun\'s Orbit',
    category: 'cosmology',
    quranicReference: {
      surah: 36,
      ayah: 40,
      arabicText: 'وَالشَّمْسُ تَجْرِي لِمُسْتَقَرٍّ لَّهَا',
      translation: 'And the sun runs [on course] toward its stopping point.'
    },
    scientificEvidence: 'It was long believed the sun was stationary. Modern astronomy shows the sun orbits the galactic center at 230 km/s, taking 225 million years to complete one orbit.',
    discoveryYear: 1920,
    quranYear: 610,
    sources: ['https://www.nasa.gov/feature/goddard/2019/how-fast-is-the-solar-system-moving'],
    difficulty: 'easy'
  },
  {
    id: 'skin-pain',
    title: 'Pain Receptors in the Skin',
    category: 'biology',
    quranicReference: {
      surah: 4,
      ayah: 56,
      arabicText: 'كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ',
      translation: 'Every time their skins are roasted through We will replace them with other skins so they may taste the punishment.'
    },
    scientificEvidence: 'Modern medicine confirms pain receptors are located in the skin. Once skin is completely burned (3rd degree burns), there is no pain because the nerve endings are destroyed.',
    discoveryYear: 1880,
    quranYear: 610,
    sources: ['https://www.ncbi.nlm.nih.gov/books/NBK513253/'],
    difficulty: 'medium'
  },
];

// TAJ Principles for the Anchor flow (New Muslims)
// "The Anchor Journey" - Faith-building facts with compounding probability
export const tajPrinciples: Fact[] = [
  {
    id: 'quran-preservation',
    title: 'Perfect Textual Preservation',
    category: 'preservation',
    description: 'The Quran is the only religious text memorized word-for-word by millions across the world, with manuscripts dating to the Prophet\'s time matching today\'s text exactly.',
    evidence: 'The Birmingham Quran manuscript (dated 568-645 CE by radiocarbon dating) matches modern Qurans word-for-word.',
    probabilityWeight: 0.15,
    sources: ['https://www.birmingham.ac.uk/news/latest/2015/07/quran-manuscript-dated-among-the-oldest-in-the-world.aspx'],
    verificationQuestion: 'Do you understand that the Quran has been preserved unchanged for 1400+ years?'
  },
  {
    id: 'prophecy-rome-persia',
    title: 'Prophecy: Rome Will Defeat Persia',
    category: 'prophecy',
    description: 'Surah Ar-Rum (30:2-4) predicted Rome would defeat Persia within 3-9 years, at a time when Rome had just suffered devastating losses.',
    evidence: 'The Byzantine Empire defeated Persia in 627 CE, exactly within the timeframe predicted.',
    probabilityWeight: 0.12,
    sources: ['https://www.britannica.com/event/Byzantine-Sasanian-wars'],
    verificationQuestion: 'Do you see how this specific prophecy came true against all odds?'
  },
  {
    id: 'oral-tradition',
    title: 'Unbroken Chain of Memorization',
    category: 'preservation',
    description: 'The Quran has been continuously memorized in its entirety by millions of people in every generation since the Prophet Muhammad, with verified chains of transmission (isnad).',
    evidence: 'Today, there are over 10 million Huffaz (people who have memorized the entire Quran) worldwide. Many can trace their memorization chain directly back to the Prophet.',
    probabilityWeight: 0.10,
    sources: ['https://www.quranfoundation.org/huffaz-statistics'],
    verificationQuestion: 'Do you appreciate how unlikely it is for any text to survive unchanged through this method?'
  },
  {
    id: 'prophecy-jerusalem',
    title: 'Prophecy: Return to Jerusalem',
    category: 'prophecy',
    description: 'The Quran (17:104) and Hadith predicted that the Children of Israel would return to their land in the end times, after being scattered.',
    evidence: 'After nearly 2000 years of diaspora, the modern state of Israel was established in 1948, fulfilling what many scholars see as an end-times prophecy.',
    probabilityWeight: 0.08,
    sources: ['https://www.britannica.com/place/Israel'],
    verificationQuestion: 'Do you see how this historical development matches the prophetic text?'
  },
  {
    id: 'linguistic-miracle',
    title: 'The Linguistic Challenge',
    category: 'linguistic',
    description: 'The Quran issues an open challenge: produce even one chapter (surah) like it. In 1400+ years, despite Arabic being widely spoken, no one has successfully met this challenge.',
    evidence: 'The Quran\'s linguistic style is unique—neither poetry nor prose—with perfect rhythm, meaning, and literary devices that have never been replicated.',
    probabilityWeight: 0.12,
    sources: ['https://www.islamic-awareness.org/quran/text/challenge/'],
    verificationQuestion: 'Do you understand why this challenge remains unmet after 14 centuries?'
  },
  {
    id: 'prophet-character',
    title: 'The Prophet\'s Character',
    category: 'historical',
    description: 'Even before prophethood, Muhammad was known as "Al-Amin" (The Trustworthy). His enemies testified to his honesty, even while opposing his message.',
    evidence: 'Historical records show that during the boycott of Muslims, Meccan leaders still entrusted their valuables to Muhammad because of his known integrity.',
    probabilityWeight: 0.08,
    sources: ['https://www.britannica.com/biography/Muhammad'],
    verificationQuestion: 'Does a man of perfect honesty dedicate his life to a lie he invented?'
  },
  {
    id: 'no-contradictions',
    title: 'Internal Consistency',
    category: 'linguistic',
    description: 'The Quran was revealed over 23 years in different circumstances, yet contains no internal contradictions—a challenge it issues in 4:82.',
    evidence: 'Scholars and critics for 1400 years have attempted to find genuine contradictions without success. Apparent ones are resolved through context and Arabic linguistics.',
    probabilityWeight: 0.10,
    sources: ['https://quran.com/4/82'],
    verificationQuestion: 'Can you see how difficult it would be for any human to maintain this consistency over 23 years?'
  },
  {
    id: 'prophecy-spread',
    title: 'Prophecy: Islam\'s Spread',
    category: 'prophecy',
    description: 'The Quran (48:28, 61:9) promised that Islam would spread to all corners of the world, despite the Muslims being a small, persecuted group at the time.',
    evidence: 'Islam is now the world\'s second-largest religion with 1.8 billion followers across every continent, and the fastest-growing religion globally.',
    probabilityWeight: 0.07,
    sources: ['https://www.pewresearch.org/religion/2017/04/05/the-changing-global-religious-landscape/'],
    verificationQuestion: 'How could a persecuted minority in 7th-century Arabia confidently predict this global reach?'
  },
  {
    id: 'unchanged-message',
    title: 'Consistency with Previous Prophets',
    category: 'historical',
    description: 'Islam teaches the same core message as all previous prophets: worship One God alone. This continuity spans from Adam to Muhammad.',
    evidence: 'The five pillars of Islam (faith, prayer, charity, fasting, pilgrimage) have parallels in Jewish and early Christian traditions, suggesting a common divine origin.',
    probabilityWeight: 0.06,
    sources: ['https://www.britannica.com/topic/five-pillars-of-Islam'],
    verificationQuestion: 'Do you see how Islam corrects and completes the message of earlier scriptures?'
  },
  {
    id: 'scientific-accuracy',
    title: 'Scientific Statements',
    category: 'historical',
    description: 'The Quran contains numerous statements about the natural world that were unknowable in the 7th century but have since been confirmed by modern science.',
    evidence: 'From embryology to the expanding universe, from the barrier between seas to mountains having deep roots—these were revealed to an illiterate man in the desert.',
    probabilityWeight: 0.12,
    sources: ['https://www.quranmiracles.com/'],
    verificationQuestion: 'If you\'ve seen the Explore journey, do these scientific accuracies strengthen your certainty?'
  },
];

/**
 * Calculate the compounding probability of divine origin
 * Based on the principle: If each fact has X% chance of being coincidence,
 * the probability they're ALL coincidences decreases exponentially
 *
 * For each fact, we estimate the probability someone could guess it correctly.
 * Example: The Quran describing embryonic stages correctly = 1 in 1000 chance
 *
 * P(divine) = 1 - P(all are coincidences)
 * P(all coincidences) = P(1) * P(2) * P(3) * ...
 */
export function calculateCompoundProbability(verifiedFactIds: string[]): number {
  const verifiedFacts = tajPrinciples.filter(f => verifiedFactIds.includes(f.id));

  if (verifiedFacts.length === 0) return 0;

  // Each fact has a probabilityWeight representing its "improbability"
  // We use a more aggressive formula: each verified fact reduces coincidence chance significantly
  // Base chance of one coincidence: 1 in 100 (1%)
  // With each additional fact, this compounds multiplicatively

  const baseCoincidenceChance = 0.1; // 10% chance each could be coincidence
  const coincidenceProbability = Math.pow(baseCoincidenceChance, verifiedFacts.length);

  // P(divine) = 1 - P(all coincidences)
  // With 10 facts: 1 - (0.1)^10 = 1 - 0.0000000001 = 99.99999999%
  return Math.min(1 - coincidenceProbability, 0.9999999999); // Cap at 99.99999999%
}

/**
 * Get a formatted percentage string for display
 * Shows more precision for higher probabilities
 */
export function getFormattedProbability(verifiedFactIds: string[]): string {
  const probability = calculateCompoundProbability(verifiedFactIds);
  const percentage = probability * 100;

  if (percentage >= 99.99) {
    // Show as "99.999...%" for very high probabilities
    const nines = Math.min(Math.floor(-Math.log10(1 - probability)), 8);
    return `99.${'9'.repeat(nines)}%`;
  } else if (percentage >= 99) {
    return `${percentage.toFixed(2)}%`;
  } else {
    return `${percentage.toFixed(1)}%`;
  }
}
