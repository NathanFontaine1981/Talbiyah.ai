// Investigation Scenarios — detective-style "case files" for each pillar
// Users examine evidence and eliminate possibilities to discover Islamic truths

export interface InvestigationEvidence {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string; // Lucide icon name
}

export interface InvestigationPossibility {
  id: string;
  label: string;
  description: string;
  evidenceAgainst: string[]; // Evidence IDs that contradict this
  isCorrect: boolean;
}

export interface InvestigationReflection {
  question: string;
  quranicReference?: string;
}

export interface InvestigationScenario {
  id: string;
  pillarSlug: string;
  title: string;
  hookQuestion: string;
  hookDescription: string;
  evidence: InvestigationEvidence[];
  possibilities: InvestigationPossibility[];
  conclusionTitle: string;
  conclusionText: string;
  reflections: InvestigationReflection[];
  nextStepText: string;
}

export const INVESTIGATION_SCENARIOS: InvestigationScenario[] = [
  // ── Pillar 1: Allah ──────────────────────────────────────
  {
    id: 'the-author',
    pillarSlug: 'allah',
    title: 'The Author',
    hookQuestion: 'Who wrote the Quran?',
    hookDescription:
      'A book appears in 7th-century Arabia that transforms the world. It claims to be from the Creator of the universe. Examine the evidence and determine: who could have authored this text?',
    evidence: [
      {
        id: 'literary-miracle',
        title: 'The Literary Challenge',
        content:
          'The Quran challenges anyone to produce even a single chapter like it (2:23). In 1,400 years, no one — poet, scholar, or AI — has successfully met this challenge. Arabic literary experts, even non-Muslim ones, acknowledge its unique linguistic structure that follows no known pattern of Arabic poetry or prose.',
        category: 'Language',
        icon: 'BookOpen'
      },
      {
        id: 'scientific-accuracy',
        title: 'Scientific Descriptions',
        content:
          'The Quran describes the expansion of the universe (51:47), the embryonic stages of human development (23:12-14), the barrier between salt and fresh water (55:19-20), and mountains as stabilizers (78:6-7) — all verified by modern science, centuries after revelation.',
        category: 'Science',
        icon: 'Microscope'
      },
      {
        id: 'historical-context',
        title: 'The Prophet\'s Background',
        content:
          'Muhammad (peace be upon him) was unlettered — he could not read or write. He was a shepherd and trader, not a scholar or poet. Before revelation, he was known for honesty (Al-Amin) but had no literary or scientific training.',
        category: 'History',
        icon: 'History'
      },
      {
        id: 'internal-consistency',
        title: 'Perfect Consistency',
        content:
          'The Quran was revealed over 23 years in vastly different circumstances — war, peace, personal loss, triumph — yet contains no contradictions. It even states: "Had it been from other than Allah, they would have found within it much contradiction" (4:82).',
        category: 'Analysis',
        icon: 'Search'
      },
      {
        id: 'prophecies',
        title: 'Fulfilled Prophecies',
        content:
          'The Quran predicted the Romans would defeat the Persians within a few years (30:2-4) — fulfilled exactly. It predicted the preservation of Pharaoh\'s body (10:92) — his mummy was discovered centuries later. Multiple specific predictions came true.',
        category: 'Prophecy',
        icon: 'Eye'
      }
    ],
    possibilities: [
      {
        id: 'muhammad-authored',
        label: 'Muhammad wrote it himself',
        description: 'A brilliant but uneducated man composed the entire work.',
        evidenceAgainst: ['literary-miracle', 'historical-context', 'scientific-accuracy'],
        isCorrect: false
      },
      {
        id: 'other-humans',
        label: 'Other scholars helped compose it',
        description: 'A group of learned people secretly authored the text.',
        evidenceAgainst: ['literary-miracle', 'internal-consistency', 'prophecies'],
        isCorrect: false
      },
      {
        id: 'copied-texts',
        label: 'It was copied from earlier scriptures',
        description: 'Content was borrowed from the Torah, Bible, or other texts.',
        evidenceAgainst: ['scientific-accuracy', 'literary-miracle', 'internal-consistency'],
        isCorrect: false
      },
      {
        id: 'divine-origin',
        label: 'It is from Allah, the Creator',
        description: 'The text was revealed by God to Prophet Muhammad through Angel Jibreel.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'The Quran is from Allah',
    conclusionText:
      'When we examine all the evidence — the unmatched literary style, the scientific accuracy centuries ahead of its time, the perfect internal consistency over 23 years, the fulfilled prophecies, and the background of the messenger — only one conclusion remains: the Quran is the word of Allah, revealed to Muhammad (peace be upon him) through Angel Jibreel.\n\nAllah says: "This is the Book about which there is no doubt, a guidance for those conscious of Allah." (Quran 2:2)',
    reflections: [
      {
        question: 'If the Quran is truly from the Creator, what does that mean for how you should approach it?',
        quranicReference: '"Will they not then ponder the Quran? If it had been from anyone other than Allah, they would have found in it many contradictions." (4:82)'
      },
      {
        question: 'What stops people from accepting something when the evidence is clear?'
      }
    ],
    nextStepText: 'Explore the Tawheed courses to understand who Allah is'
  },

  // ── Pillar 2: Muhammad ──────────────────────────────────
  {
    id: 'the-final-prophet',
    pillarSlug: 'muhammad',
    title: 'The Final Prophet',
    hookQuestion: 'How do we identify a true prophet?',
    hookDescription:
      'Throughout history, many have claimed prophethood. Some were liars, some were deluded, and some were truly sent by God. What criteria can we use to identify a genuine prophet? Examine the evidence about Muhammad (peace be upon him).',
    evidence: [
      {
        id: 'character-testimony',
        title: 'Character Before Prophethood',
        content:
          'For 40 years before claiming prophethood, Muhammad was known as "Al-Amin" (The Trustworthy) and "As-Sadiq" (The Truthful). Even his enemies acknowledged his honesty. Abu Jahl, his fiercest opponent, once said: "We do not call you a liar, but we deny what you brought."',
        category: 'Character',
        icon: 'Shield'
      },
      {
        id: 'no-worldly-gain',
        title: 'No Personal Gain',
        content:
          'Despite leading a growing nation, Muhammad lived in poverty. His mattress was made of leather stuffed with palm fiber. He often went days without a proper meal. He was offered wealth, kingship, and women by the Quraysh to stop preaching — he refused everything.',
        category: 'Motive',
        icon: 'Scale'
      },
      {
        id: 'message-consistency',
        title: 'Consistent with Previous Prophets',
        content:
          'His core message — worship One God alone — is identical to what Abraham, Moses, and Jesus taught. He confirmed previous prophets, corrected distortions, and completed the message. He didn\'t invent a new religion but restored the original one.',
        category: 'Message',
        icon: 'Link'
      },
      {
        id: 'prophecies-fulfilled',
        title: 'Verified Predictions',
        content:
          'He predicted the Muslim conquest of Jerusalem, Constantinople, and Persia — all fulfilled. He described future trials (fitnah) with precision. He foretold that barefoot Bedouins would compete in building tall towers — visible today in the Gulf states.',
        category: 'Prophecy',
        icon: 'Eye'
      },
      {
        id: 'lasting-impact',
        title: 'Transformative Legacy',
        content:
          'In just 23 years, he transformed a tribal, idol-worshipping society into a civilization that preserved knowledge during Europe\'s Dark Ages. His teachings on justice, hygiene, charity, and human rights were centuries ahead. Over 1.8 billion follow his way today.',
        category: 'Legacy',
        icon: 'Globe'
      }
    ],
    possibilities: [
      {
        id: 'liar',
        label: 'He was a deliberate liar',
        description: 'He knowingly fabricated his prophethood for personal gain.',
        evidenceAgainst: ['character-testimony', 'no-worldly-gain', 'message-consistency'],
        isCorrect: false
      },
      {
        id: 'deluded',
        label: 'He was sincerely mistaken',
        description: 'He genuinely believed he was a prophet but was deluded.',
        evidenceAgainst: ['prophecies-fulfilled', 'message-consistency', 'lasting-impact'],
        isCorrect: false
      },
      {
        id: 'political-leader',
        label: 'He was just a political leader',
        description: 'He used religion as a tool to gain power and unite Arabia.',
        evidenceAgainst: ['no-worldly-gain', 'character-testimony', 'prophecies-fulfilled'],
        isCorrect: false
      },
      {
        id: 'true-prophet',
        label: 'He was a true prophet of Allah',
        description: 'He was chosen and sent by God as the final messenger to mankind.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'Muhammad is the Final Messenger',
    conclusionText:
      'The evidence is overwhelming. A man of impeccable character who sought no worldly gain, whose message perfectly aligned with all previous prophets, whose predictions came true, and whose legacy transformed humanity — Muhammad (peace be upon him) was undeniably a true prophet.\n\nAllah says: "Muhammad is not the father of any of your men, but he is the Messenger of Allah and the seal of the prophets." (Quran 33:40)',
    reflections: [
      {
        question: 'If Muhammad (peace be upon him) is truly the final messenger, what obligation does that place on us?',
        quranicReference: '"Say: If you love Allah, then follow me, and Allah will love you and forgive your sins." (3:31)'
      },
      {
        question: 'Why do you think Allah chose someone unlettered and from a humble background?'
      }
    ],
    nextStepText: 'Study the Seerah to learn his life story'
  },

  // ── Pillar 3: Prophets ──────────────────────────────────
  {
    id: 'the-message',
    pillarSlug: 'prophets',
    title: 'The Message',
    hookQuestion: 'Would God leave humanity without guidance?',
    hookDescription:
      'Imagine creating something precious — would you leave it without instructions? Throughout history, civilizations received messengers with a remarkably consistent message. Investigate the pattern.',
    evidence: [
      {
        id: 'universal-pattern',
        title: 'Universal Messenger Pattern',
        content:
          'The Quran mentions 25 prophets by name and states there were many more (40:78). Every civilization received guidance: "And there was no nation but a warner had passed among them" (35:24). From Adam to Muhammad — a continuous chain of messengers.',
        category: 'Pattern',
        icon: 'Link'
      },
      {
        id: 'one-message',
        title: 'One Core Message',
        content:
          'Despite spanning thousands of years and different cultures, every prophet delivered the same core message: worship the One Creator alone, do good, avoid evil, and believe in accountability after death. Abraham, Moses, Jesus, and Muhammad all taught Tawheed.',
        category: 'Message',
        icon: 'MessageCircle'
      },
      {
        id: 'human-need',
        title: 'Humanity\'s Need for Guidance',
        content:
          'Left to their own devices, humans have worshipped the sun, animals, statues, other humans, and even themselves. Every society that strayed from monotheism descended into injustice. History shows humans need external, divine guidance to find truth.',
        category: 'Observation',
        icon: 'Users'
      },
      {
        id: 'divine-mercy',
        title: 'Justice Requires Warning',
        content:
          'A just Creator would not punish people without first sending clear guidance. The Quran states: "We would never punish until We have sent a messenger" (17:15). Prophets are proof of God\'s mercy and justice — no one can claim ignorance.',
        category: 'Logic',
        icon: 'Scale'
      },
      {
        id: 'preserved-accounts',
        title: 'Cross-Cultural Confirmation',
        content:
          'Stories of prophets like Noah, Abraham, Moses, and Jesus appear in Judaism, Christianity, and Islam. While details differ, the core narratives align — a flood survivor, a father of nations, a liberator from oppression, a miraculous birth. Multiple sources confirm these figures existed.',
        category: 'Evidence',
        icon: 'BookOpen'
      }
    ],
    possibilities: [
      {
        id: 'no-guidance',
        label: 'God doesn\'t intervene in human affairs',
        description: 'The Creator made the universe but doesn\'t communicate with humans.',
        evidenceAgainst: ['universal-pattern', 'divine-mercy', 'human-need'],
        isCorrect: false
      },
      {
        id: 'multiple-religions',
        label: 'Different gods sent different messages',
        description: 'Various deities independently sent conflicting guidance.',
        evidenceAgainst: ['one-message', 'universal-pattern', 'preserved-accounts'],
        isCorrect: false
      },
      {
        id: 'human-invention',
        label: 'Prophets invented their own teachings',
        description: 'Wise men independently created moral systems and attributed them to God.',
        evidenceAgainst: ['one-message', 'preserved-accounts', 'universal-pattern'],
        isCorrect: false
      },
      {
        id: 'divine-chain',
        label: 'One God sent a chain of prophets',
        description: 'Allah sent messengers throughout history with one consistent message.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'One God, One Message, Many Messengers',
    conclusionText:
      'The evidence reveals a beautiful pattern: One Creator, sending One Message, through a chain of Prophets, to all of humanity. This is not coincidence — it is a divine system of mercy and guidance.\n\nAllah says: "We sent a messenger to every community, saying, \'Worship Allah and shun false gods.\'" (Quran 16:36)',
    reflections: [
      {
        question: 'If every nation received a prophet, what does that tell you about Allah\'s care for humanity?',
        quranicReference: '"We have sent you (Muhammad) only as a mercy for the worlds." (21:107)'
      },
      {
        question: 'Why do you think the core message of all prophets was the same?'
      }
    ],
    nextStepText: 'Learn the stories of the prophets'
  },

  // ── Pillar 4: Angels ────────────────────────────────────
  {
    id: 'the-universe',
    pillarSlug: 'angels',
    title: 'The Universe',
    hookQuestion: 'How did the universe come into existence?',
    hookDescription:
      'The universe had a beginning. Something caused it. Scientists call it the Big Bang — but what caused the Bang? Investigate what the evidence tells us about the unseen forces behind creation.',
    evidence: [
      {
        id: 'beginning-of-universe',
        title: 'The Universe Had a Beginning',
        content:
          'Modern cosmology confirms the universe began approximately 13.8 billion years ago. Before this, there was no space, no time, no matter. Something outside the universe must have caused it — the cause cannot be part of the effect.',
        category: 'Cosmology',
        icon: 'Orbit'
      },
      {
        id: 'fine-tuning',
        title: 'Precise Fine-Tuning',
        content:
          'The gravitational constant, electromagnetic force, nuclear forces, and dozens of other values are calibrated to extraordinary precision. Change any by a fraction and life — even atoms — could not exist. This precision suggests intentional design, not randomness.',
        category: 'Physics',
        icon: 'Settings'
      },
      {
        id: 'quran-on-creation',
        title: 'Quranic Account of Creation',
        content:
          'The Quran states Allah created the heavens and earth in six periods (7:54) and that He created angels from light, jinn from fire, and humans from clay. Angels are described as beings who execute Allah\'s commands throughout the universe — managing rain, recording deeds, carrying revelations.',
        category: 'Revelation',
        icon: 'BookOpen'
      },
      {
        id: 'unseen-reality',
        title: 'Science Confirms the Unseen',
        content:
          'We cannot see gravity, dark matter, dark energy, radio waves, or X-rays — yet we accept they exist based on their effects. Over 95% of the universe is made of dark matter and dark energy, which are invisible. The unseen is far greater than the seen.',
        category: 'Science',
        icon: 'Microscope'
      },
      {
        id: 'angel-accounts',
        title: 'Consistent Accounts of Angels',
        content:
          'Belief in angels appears across Judaism, Christianity, and Islam. Jibreel (Gabriel) delivered God\'s message to Mary and to Muhammad. Specific angels have specific roles: Mikail (provision), Israfil (the trumpet), and Malak al-Maut (angel of death). The Quran provides detailed, consistent descriptions.',
        category: 'Theology',
        icon: 'Sparkles'
      }
    ],
    possibilities: [
      {
        id: 'self-created',
        label: 'The universe created itself from nothing',
        description: 'Matter and energy spontaneously appeared without any cause.',
        evidenceAgainst: ['beginning-of-universe', 'fine-tuning'],
        isCorrect: false
      },
      {
        id: 'eternal-universe',
        label: 'The universe always existed',
        description: 'There was no beginning — the universe is infinitely old.',
        evidenceAgainst: ['beginning-of-universe', 'fine-tuning'],
        isCorrect: false
      },
      {
        id: 'random-chance',
        label: 'Everything is a lucky accident',
        description: 'Pure randomness produced the perfectly calibrated universe we observe.',
        evidenceAgainst: ['fine-tuning', 'quran-on-creation', 'unseen-reality'],
        isCorrect: false
      },
      {
        id: 'divine-creation',
        label: 'An all-powerful Creator designed it all',
        description: 'Allah created the universe and appointed angels to carry out His commands within it.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'Allah Created and Governs Through His Angels',
    conclusionText:
      'The universe\'s beginning, its extraordinary fine-tuning, and the vastness of the unseen all point to an all-powerful, all-knowing Creator. Allah governs His creation through angels — beings of light who execute His will with perfect obedience.\n\nAllah says: "Praise be to Allah, Creator of the heavens and the earth, who made the angels messengers with wings — two, three, or four." (Quran 35:1)',
    reflections: [
      {
        question: 'If 95% of the universe is invisible to us, why do some people reject the existence of angels simply because they can\'t see them?',
        quranicReference: '"He knows what is before them and what is behind them, and they cannot intercede except on behalf of one whom He approves." (21:28)'
      },
      {
        question: 'How does knowing that angels are recording your deeds change how you go about your day?'
      }
    ],
    nextStepText: 'Learn about the angels and their roles'
  },

  // ── Pillar 5: Hereafter ─────────────────────────────────
  {
    id: 'the-design',
    pillarSlug: 'hereafter',
    title: 'The Design',
    hookQuestion: 'Is the complexity of life accidental or intentional?',
    hookDescription:
      'A single human cell contains more information than an encyclopedia. DNA is the most efficient information storage system known. If life is designed, then the Designer must have a purpose — and a plan for what comes after.',
    evidence: [
      {
        id: 'dna-complexity',
        title: 'The Code of Life',
        content:
          'Human DNA contains approximately 3.2 billion base pairs of information — equivalent to 750 megabytes of data. It directs the construction of 37 trillion cells, each performing specific functions. No known process produces functional, complex coded information by accident.',
        category: 'Biology',
        icon: 'Dna'
      },
      {
        id: 'innate-justice',
        title: 'The Human Sense of Justice',
        content:
          'Every human has an innate sense that oppressors should face consequences and the oppressed deserve compensation. Throughout history, tyrants have escaped earthly justice. If there is no afterlife, Hitler, Pharaoh, and every oppressor "got away with it." The universal desire for justice demands an ultimate court.',
        category: 'Philosophy',
        icon: 'Scale'
      },
      {
        id: 'purpose-of-life',
        title: 'Life Without Purpose?',
        content:
          'If life ends permanently at death, then all human achievement, love, suffering, and striving are ultimately meaningless. A purpose-driven Creator would not create beings capable of deep thought and morality just for them to vanish into nothing. Purpose implies accountability.',
        category: 'Logic',
        icon: 'Lightbulb'
      },
      {
        id: 'near-death-experiences',
        title: 'Witnesses from the Edge',
        content:
          'Thousands of documented near-death experiences across cultures describe leaving the body, seeing a bright light, encountering a boundary, and being told to return. While interpretations vary, the consistency of these reports suggests consciousness extends beyond physical death.',
        category: 'Testimony',
        icon: 'Heart'
      },
      {
        id: 'quran-on-hereafter',
        title: 'The Quranic Promise',
        content:
          'The Quran describes the Hereafter in vivid detail: the Day of Judgment where every deed is weighed (99:7-8), Paradise for the righteous with eternal peace, and Hellfire for the willfully unjust. Allah says: "Every soul shall taste death, and you will be paid in full on the Day of Judgment" (3:185).',
        category: 'Revelation',
        icon: 'BookOpen'
      }
    ],
    possibilities: [
      {
        id: 'no-afterlife',
        label: 'Death is the absolute end',
        description: 'Consciousness ceases permanently when the brain stops functioning.',
        evidenceAgainst: ['innate-justice', 'purpose-of-life', 'quran-on-hereafter'],
        isCorrect: false
      },
      {
        id: 'reincarnation',
        label: 'Souls are recycled into new bodies',
        description: 'After death, the soul is reborn in a different form.',
        evidenceAgainst: ['innate-justice', 'quran-on-hereafter', 'purpose-of-life'],
        isCorrect: false
      },
      {
        id: 'universal-salvation',
        label: 'Everyone goes to a good place regardless',
        description: 'A loving God would never punish anyone, so all end up in paradise.',
        evidenceAgainst: ['innate-justice', 'quran-on-hereafter'],
        isCorrect: false
      },
      {
        id: 'judgment-day',
        label: 'There is a Day of Judgment with accountability',
        description: 'Allah will resurrect all people, judge them fairly, and reward or punish based on deeds and faith.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'The Hereafter is Real and Justice Will Be Served',
    conclusionText:
      'The extraordinary design of life, the universal human yearning for justice, the purposelessness of existence without accountability, and the consistent testimony of revelation all converge on one truth: death is not the end. There is a Day of Judgment, and every soul will be held accountable.\n\nAllah says: "Did you think that We created you in vain, and that you would not be returned to Us?" (Quran 23:115)',
    reflections: [
      {
        question: 'If you truly believed that every action — even the weight of an atom — will be accounted for, how would that change your daily life?',
        quranicReference: '"So whoever does an atom\'s weight of good will see it, and whoever does an atom\'s weight of evil will see it." (99:7-8)'
      },
      {
        question: 'Why do you think belief in the Hereafter is considered one of the strongest motivators for doing good?'
      }
    ],
    nextStepText: 'Study the Hereafter in depth'
  },

  // ── Pillar 6: History ───────────────────────────────────
  {
    id: 'the-preservation',
    pillarSlug: 'history',
    title: 'The Preservation',
    hookQuestion: 'Has any religious text survived unchanged?',
    hookDescription:
      'Every religion claims divine origin for its scripture. But words can be altered, texts can be corrupted, and translations can distort. Is there a single religious text that has been perfectly preserved since its revelation? Investigate the evidence.',
    evidence: [
      {
        id: 'oral-tradition',
        title: 'The Oral Preservation',
        content:
          'Millions of Muslims worldwide have memorized the entire Quran word-for-word (Huffaz). This tradition has been unbroken since the Prophet\'s time. If every written copy were destroyed today, the Quran could be reconstructed perfectly from memory alone. No other text in history has this level of human preservation.',
        category: 'Tradition',
        icon: 'Users'
      },
      {
        id: 'manuscript-evidence',
        title: 'Manuscript Evidence',
        content:
          'The Birmingham manuscript, carbon-dated to within the Prophet Muhammad\'s lifetime, matches today\'s Quran perfectly. The Sana\'a manuscripts, the Topkapi manuscript, and dozens of early copies all confirm: the text has not changed in 1,400 years.',
        category: 'Archaeology',
        icon: 'Search'
      },
      {
        id: 'divine-promise',
        title: 'Allah\'s Guarantee',
        content:
          'Unlike previous scriptures, Allah explicitly promised to preserve the Quran: "Indeed, it is We who sent down the reminder, and indeed, We will be its guardian" (15:9). This is the only scripture with a built-in guarantee of preservation — and the evidence shows this promise has been fulfilled.',
        category: 'Revelation',
        icon: 'Shield'
      },
      {
        id: 'other-texts-comparison',
        title: 'Comparison with Other Texts',
        content:
          'The Torah has multiple versions (Masoretic, Samaritan, Septuagint) with thousands of differences. The New Testament has over 5,000 Greek manuscripts with 300,000+ textual variants. Scholars debate which version is "original." The Quran, by contrast, has one universally accepted text with zero variants in meaning.',
        category: 'Comparison',
        icon: 'GitCompare'
      },
      {
        id: 'standardization-history',
        title: 'The Uthmanic Compilation',
        content:
          'Within 20 years of the Prophet\'s death, Caliph Uthman compiled an official written copy from verified memorizers and written fragments, sending copies to major cities. This process was supervised by companions who had memorized the Quran directly from the Prophet. The chain of custody is documented and verifiable.',
        category: 'History',
        icon: 'History'
      }
    ],
    possibilities: [
      {
        id: 'all-corrupted',
        label: 'All religious texts have been altered',
        description: 'No scripture has survived unchanged — they\'ve all been modified over time.',
        evidenceAgainst: ['oral-tradition', 'manuscript-evidence', 'divine-promise'],
        isCorrect: false
      },
      {
        id: 'bible-preserved',
        label: 'The Bible is the best-preserved text',
        description: 'The Bible has the most manuscript copies and is therefore the most reliable.',
        evidenceAgainst: ['other-texts-comparison', 'manuscript-evidence', 'oral-tradition'],
        isCorrect: false
      },
      {
        id: 'doesnt-matter',
        label: 'Textual preservation doesn\'t matter',
        description: 'The spirit of the message matters more than exact wording.',
        evidenceAgainst: ['divine-promise', 'standardization-history'],
        isCorrect: false
      },
      {
        id: 'quran-preserved',
        label: 'The Quran alone has been perfectly preserved',
        description: 'Through divine protection and an unbroken chain of memorization, the Quran is unchanged.',
        evidenceAgainst: [],
        isCorrect: true
      }
    ],
    conclusionTitle: 'The Quran is the Only Perfectly Preserved Scripture',
    conclusionText:
      'The evidence is conclusive. Through an extraordinary combination of mass memorization, early written compilation, and divine protection, the Quran stands alone as the only religious text that is exactly the same today as when it was first revealed. This preservation is itself a miracle and a proof of its divine origin.\n\nAllah says: "Indeed, it is We who sent down the reminder, and indeed, We will be its guardian." (Quran 15:9)',
    reflections: [
      {
        question: 'If Allah preserved the Quran for 1,400 years, what does that say about its importance for your life today?',
        quranicReference: '"This is a blessed Book which We have revealed to you, that they might reflect upon its verses." (38:29)'
      },
      {
        question: 'Millions of people have memorized the entire Quran. What does this tell you about the relationship between the Quran and the human heart?'
      }
    ],
    nextStepText: 'Explore the history of Islamic civilization'
  }
];

// Helper to get scenario by pillar slug
export function getScenarioForPillar(pillarSlug: string): InvestigationScenario | undefined {
  return INVESTIGATION_SCENARIOS.find(s => s.pillarSlug === pillarSlug);
}
