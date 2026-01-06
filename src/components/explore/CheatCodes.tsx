import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  Coins,
  Users,
  Sparkles,
  BookOpen,
  Shield,
  Target,
  Flame,
  Eye,
  Scale,
  HandHeart,
  Home,
  Briefcase,
  Smile,
  Clock,
  AlertTriangle,
  Star,
  Droplets,
  X,
  HelpCircle,
  Search
} from 'lucide-react';

interface CheatCodesProps {
  verifiedCount: number;
  totalFacts: number;
  onComplete: () => void;
}

interface LifeGuidance {
  id: string;
  title: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  conceptExplanation?: {
    whatYouMightThink: string;
    whatItActuallyMeans: string;
    keyInsight?: string;
  };
  quranVerses: Array<{
    arabic?: string;
    text: string;
    reference: string;
  }>;
  hadith: Array<{
    text: string;
    narrator: string;
    source: string;
  }>;
  halfWidth?: boolean;
}

const lifeGuidanceTopics: LifeGuidance[] = [
  {
    id: 'tawheed',
    title: 'Tawheed - The Foundation',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-emerald-900/40',
    borderClass: 'border-emerald-500/70',
    textClass: 'text-emerald-400',
    description: 'Oneness of Allah - the KEY',
    halfWidth: true,
    conceptExplanation: {
      whatYouMightThink: 'Believing in one God is simple enough—most religions claim to do this.',
      whatItActuallyMeans: 'Tawheed means knowing Allah\'s Names and Attributes—understanding WHO He is, what He does, and what only HE deserves. This knowledge protects you from Shirk. When you know what Allah IS, you know what He is NOT. You won\'t accidentally give His rights to anyone else.',
      keyInsight: 'Tawheed is the opposite of Shirk. By learning Allah\'s 99 Names and Attributes, you understand His uniqueness. He alone creates, sustains, gives life, takes life, answers prayers, and controls all affairs. Knowing this deeply means you will never turn to creation for what only the Creator can provide.',
    },
    quranVerses: [
      {
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        text: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there any equivalent to Him.',
        reference: 'Quran 112:1-4 (Surah Al-Ikhlas)',
      },
      {
        text: 'There is nothing like unto Him, and He is the All-Hearing, the All-Seeing.',
        reference: 'Quran 42:11',
      },
      {
        text: 'And to Allah belong the most beautiful Names, so invoke Him by them.',
        reference: 'Quran 7:180',
      },
    ],
    hadith: [
      {
        text: 'Allah has ninety-nine Names. Whoever memorizes and understands them will enter Paradise.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'The best words are: "La ilaha illallah" (There is no god but Allah).',
        narrator: 'Jabir ibn Abdullah',
        source: 'Sunan Ibn Majah',
      },
    ],
  },
  {
    id: 'shirk',
    title: 'Shirk - The ONLY Unforgivable Sin',
    icon: <AlertTriangle className="w-6 h-6" />,
    bgClass: 'bg-rose-900/40',
    borderClass: 'border-rose-500/70',
    textClass: 'text-rose-400',
    description: 'The sin Allah will NOT forgive',
    halfWidth: true,
    conceptExplanation: {
      whatYouMightThink: 'All sins are equal, or surely God will forgive everything eventually.',
      whatItActuallyMeans: 'Shirk is giving the rights of your CREATOR to the creation. If you die believing this, Allah has made it HARAM upon Himself to forgive you. Every other sin—murder, adultery, theft—can be forgiven. But not Shirk. On that Day, you will be told: "Go to what you worshipped." But the gods you created or worshipped will have NO power, NO might.',
      keyInsight: 'This is why we say "La hawla wa la quwwata illa billah" (There is no power or might except with Allah). You are being looked after by ONE—yet thanking something that has nothing to do with you? Everything goes back to the Creator. Even if creation deserves thanks, remember it all came from the One who created that person in the first place. Worship Allah FIRST, then thank others.',
    },
    quranVerses: [
      {
        arabic: 'إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ',
        text: 'Indeed, Allah does not forgive association with Him, but He forgives what is less than that for whom He wills.',
        reference: 'Quran 4:48',
      },
      {
        text: 'And it was already revealed to you and to those before you that if you associate others with Allah, your deeds will surely become worthless, and you will surely be among the losers.',
        reference: 'Quran 39:65',
      },
      {
        text: 'And on the Day of Resurrection, He will disgrace them and say: "Where are My partners for whom you used to oppose the believers?" Those who were given knowledge will say: "Indeed, disgrace this Day and evil are upon the disbelievers."',
        reference: 'Quran 16:27',
      },
    ],
    hadith: [
      {
        text: 'Whoever dies while calling upon a rival to Allah will enter the Fire.',
        narrator: 'Abdullah ibn Mas\'ud',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'The greatest sin is that you set up a rival to Allah while He created you.',
        narrator: 'Abdullah ibn Mas\'ud',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'Whoever meets Allah without associating anything with Him will enter Paradise, and whoever meets Him having associated something with Him will enter the Fire.',
        narrator: 'Jabir ibn Abdullah',
        source: 'Sahih Muslim',
      },
    ],
  },
  {
    id: 'purpose',
    title: 'Why Are We Here?',
    icon: <Target className="w-6 h-6" />,
    bgClass: 'bg-purple-900/30',
    borderClass: 'border-purple-700/50',
    textClass: 'text-purple-400',
    description: 'The purpose of life',
    conceptExplanation: {
      whatYouMightThink: '"Worship" means sitting in a church singing hymns, or monks praying all day in isolation.',
      whatItActuallyMeans: 'In Islam, "worship" (ibadah) means to OBEY and FOLLOW. Everything you do the way the Prophet ﷺ taught carries reward—from how you eat (say Bismillah, eat with your right hand), to how you greet people (say Salam), to how you sleep (on your right side, make dua), even going to the toilet. Your entire life becomes worship when you follow the prophetic example.',
      keyInsight: 'A Muslim businessman being honest is worshipping. A mother raising children with Islamic values is worshipping. Worship isn\'t confined to a building—it\'s woven into every moment of your daily life.',
    },
    quranVerses: [
      {
        arabic: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ',
        text: 'And I did not create the jinn and mankind except to worship Me.',
        reference: 'Quran 51:56',
      },
      {
        text: 'Every soul will taste death. And you will only receive your full reward on the Day of Resurrection.',
        reference: 'Quran 3:185',
      },
    ],
    hadith: [
      {
        text: 'Be in this world as if you were a stranger or a traveler.',
        narrator: 'Ibn Umar',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'When you eat, mention the name of Allah. Eat with your right hand and eat from what is nearest to you.',
        narrator: 'Umar ibn Abi Salamah',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'salah',
    title: 'Salah - The Connection',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-emerald-900/30',
    borderClass: 'border-emerald-700/50',
    textClass: 'text-emerald-400',
    description: 'Your direct line to Allah',
    conceptExplanation: {
      whatYouMightThink: 'Prayer is something you do when you need something, or on Sundays, or when you feel spiritual.',
      whatItActuallyMeans: 'Salah is 5 daily appointments with your Creator at specific times (dawn, noon, afternoon, sunset, night). It involves physical movements (standing, bowing, prostrating) while reciting Quran in Arabic. It takes about 5-10 minutes each. You\'re literally putting your face on the ground before God—the ultimate humility.',
      keyInsight: 'Think of it like renewing your ticket to Paradise before it expires—the next prayer time is your deadline. You never know when your soul will be taken, so you need to make sure your ticket is always valid. The Prophet ﷺ said "The covenant between us and them is prayer—whoever abandons it has disbelieved." If the first question on Judgment Day goes badly, everything else will too.',
    },
    quranVerses: [
      {
        text: 'Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater.',
        reference: 'Quran 29:45',
      },
      {
        text: 'And establish prayer. Indeed, prayer has been decreed upon the believers at specified times.',
        reference: 'Quran 4:103',
      },
      {
        arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
        text: 'O you who believe, fear Allah as He should be feared and do not die except as Muslims.',
        reference: 'Quran 3:102',
      },
    ],
    hadith: [
      {
        text: 'The first matter that the slave will be brought to account for on the Day of Judgment is the prayer. If it is sound, then the rest of his deeds will be sound. And if it is corrupt, then the rest of his deeds will be corrupt.',
        narrator: 'Abu Hurairah',
        source: 'At-Tabarani',
      },
      {
        text: 'The covenant that distinguishes between us and them is prayer. Whoever abandons it has disbelieved.',
        narrator: 'Buraydah',
        source: 'Sunan an-Nasa\'i',
      },
      {
        text: 'Pray as you have seen me praying.',
        narrator: 'Malik ibn al-Huwayrith',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'piety',
    title: 'Who Is the Best Person?',
    icon: <Star className="w-6 h-6" />,
    bgClass: 'bg-amber-900/30',
    borderClass: 'border-amber-700/50',
    textClass: 'text-amber-400',
    description: 'True nobility is through piety',
    conceptExplanation: {
      whatYouMightThink: 'The best people are the richest, most famous, most powerful, or most attractive.',
      whatItActuallyMeans: 'In Islam, the only measure of superiority is "taqwa" (God-consciousness). A poor cleaner with taqwa is more noble than a billionaire without it. Race, nationality, wealth, family name—none of it matters to Allah.',
      keyInsight: 'This is revolutionary. Islam abolished the idea that some humans are inherently better than others. The Prophet\'s ﷺ final sermon explicitly stated: "An Arab has no superiority over a non-Arab, nor does a white person over a black person, except by piety."',
    },
    quranVerses: [
      {
        arabic: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ',
        text: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.',
        reference: 'Quran 49:13',
      },
    ],
    hadith: [
      {
        text: 'Allah does not look at your appearance or wealth, but He looks at your hearts and deeds.',
        narrator: 'Abu Hurairah',
        source: 'Sahih Muslim',
      },
      {
        text: 'The best among you are those who have the best character.',
        narrator: 'Abdullah ibn Amr',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'allah-sees',
    title: 'Allah Sees Everything',
    icon: <Eye className="w-6 h-6" />,
    bgClass: 'bg-blue-900/30',
    borderClass: 'border-blue-700/50',
    textClass: 'text-blue-400',
    description: 'He knows your inner thoughts',
    quranVerses: [
      {
        text: 'And He is with you wherever you are. And Allah is seeing of what you do.',
        reference: 'Quran 57:4',
      },
      {
        text: 'We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein.',
        reference: 'Quran 50:16',
      },
    ],
    hadith: [
      {
        text: 'Ihsan (excellence) is to worship Allah as if you see Him, and if you cannot see Him, then indeed He sees you.',
        narrator: 'Umar ibn al-Khattab',
        source: 'Sahih Muslim',
      },
    ],
  },
  {
    id: 'parents',
    title: 'Kindness to Parents',
    icon: <Home className="w-6 h-6" />,
    bgClass: 'bg-rose-900/30',
    borderClass: 'border-rose-700/50',
    textClass: 'text-rose-400',
    description: 'Second only to worshipping Allah',
    quranVerses: [
      {
        text: 'And your Lord has decreed that you worship none except Him, and to parents, good treatment. Whether one or both of them reach old age, do not say to them "uff" and do not repel them but speak to them a noble word.',
        reference: 'Quran 17:23',
      },
      {
        text: 'And We have enjoined upon man to be good to his parents. His mother carried him with hardship upon hardship.',
        reference: 'Quran 31:14',
      },
    ],
    hadith: [
      {
        text: 'Paradise lies at the feet of your mother.',
        narrator: 'Anas ibn Malik',
        source: 'Sunan an-Nasa\'i',
      },
      {
        text: 'The pleasure of the Lord lies in the pleasure of the parent, and the anger of the Lord lies in the anger of the parent.',
        narrator: 'Abdullah ibn Amr',
        source: 'Jami\' at-Tirmidhi',
      },
    ],
  },
  {
    id: 'charity',
    title: 'Giving in Charity',
    icon: <HandHeart className="w-6 h-6" />,
    bgClass: 'bg-teal-900/30',
    borderClass: 'border-teal-700/50',
    textClass: 'text-teal-400',
    description: 'Wealth that multiplies',
    conceptExplanation: {
      whatYouMightThink: 'Charity is optional, nice to do when you have extra money. It\'s about helping others.',
      whatItActuallyMeans: 'Islam has TWO types: Zakat (obligatory 2.5% of savings yearly—a pillar of Islam) and Sadaqah (voluntary charity). But charity isn\'t just money—smiling at someone, removing something harmful from the road, even a good word is charity. The Prophet ﷺ said every joint in your body has a charity due on it daily.',
      keyInsight: 'Your wealth isn\'t really yours—it\'s a trust from Allah. The portion for the poor was never yours to begin with. Giving it isn\'t generosity; it\'s returning what belongs to others.',
    },
    quranVerses: [
      {
        text: 'The example of those who spend their wealth in the way of Allah is like a seed of grain that sprouts seven ears; in every ear there are a hundred grains. Allah multiplies for whom He wills.',
        reference: 'Quran 2:261',
      },
      {
        text: 'Never will you attain righteousness until you spend from that which you love.',
        reference: 'Quran 3:92',
      },
    ],
    hadith: [
      {
        text: 'Charity does not decrease wealth.',
        narrator: 'Abu Hurairah',
        source: 'Sahih Muslim',
      },
      {
        text: 'Save yourself from the Hellfire even by giving half a date in charity.',
        narrator: 'Adi ibn Hatim',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'intention',
    title: 'Intention (Niyyah)',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-pink-900/30',
    borderClass: 'border-pink-700/50',
    textClass: 'text-pink-400',
    description: 'Actions are judged by intentions',
    conceptExplanation: {
      whatYouMightThink: 'What matters is what you do, not why you do it. Results matter more than motives.',
      whatItActuallyMeans: 'In Islam, the SAME action can be rewarded or worthless depending on your intention. If you give charity to impress people = no reward. If you give to please Allah = multiplied reward. Even sleeping can be worship if you intend to rest so you can worship better.',
      keyInsight: 'This is why two people can do the exact same deed—one goes to Paradise, one doesn\'t. Allah sees what\'s in your heart. You can fool everyone else, but not Him.',
    },
    quranVerses: [
      {
        text: 'Say, "Whether you conceal what is in your hearts or reveal it, Allah knows it."',
        reference: 'Quran 3:29',
      },
    ],
    hadith: [
      {
        text: 'Actions are only by intentions, and every person will have only what they intended.',
        narrator: 'Umar ibn al-Khattab',
        source: 'Sahih al-Bukhari & Muslim',
      },
      {
        text: 'Allah does not accept any deed except that which is done sincerely for Him and seeking His pleasure.',
        narrator: 'Abu Umamah',
        source: 'Sunan an-Nasa\'i',
      },
    ],
  },
  {
    id: 'business',
    title: 'Business & Honesty',
    icon: <Briefcase className="w-6 h-6" />,
    bgClass: 'bg-orange-900/30',
    borderClass: 'border-orange-700/50',
    textClass: 'text-orange-400',
    description: 'Honest trade is blessed',
    quranVerses: [
      {
        arabic: 'وَيْلٌ لِّلْمُطَفِّفِينَ ۝ الَّذِينَ إِذَا اكْتَالُوا عَلَى النَّاسِ يَسْتَوْفُونَ ۝ وَإِذَا كَالُوهُمْ أَو وَّزَنُوهُمْ يُخْسِرُونَ',
        text: 'Woe to those who give less than due—who, when they take a measure from people, take in full. But if they give by measure or weight to them, they cause loss.',
        reference: 'Quran 83:1-3 (Al-Mutaffifin)',
      },
      {
        text: 'O you who believe, do not consume one another\'s wealth unjustly but only in lawful business by mutual consent.',
        reference: 'Quran 4:29',
      },
      {
        text: 'And give full measure when you measure, and weigh with an even balance. That is the best way and best in result.',
        reference: 'Quran 17:35',
      },
    ],
    hadith: [
      {
        text: 'The truthful, trustworthy merchant is with the Prophets, the truthful, and the martyrs.',
        narrator: 'Abu Sa\'id al-Khudri',
        source: 'Jami\' at-Tirmidhi',
      },
      {
        text: 'Whoever cheats is not one of us.',
        narrator: 'Abu Hurairah',
        source: 'Sahih Muslim',
      },
    ],
  },
  {
    id: 'neighbours',
    title: 'Rights of Neighbours',
    icon: <Users className="w-6 h-6" />,
    bgClass: 'bg-indigo-900/30',
    borderClass: 'border-indigo-700/50',
    textClass: 'text-indigo-400',
    description: 'Gabriel kept advising about neighbours',
    quranVerses: [
      {
        text: 'Worship Allah and associate nothing with Him, and to parents do good, and to relatives, orphans, the needy, the near neighbour, the distant neighbour...',
        reference: 'Quran 4:36',
      },
    ],
    hadith: [
      {
        text: 'Jibreel kept advising me about the neighbour until I thought he would make him an heir.',
        narrator: 'Ibn Umar',
        source: 'Sahih al-Bukhari & Muslim',
      },
      {
        text: 'By Allah, he does not believe! By Allah, he does not believe! The one whose neighbour is not safe from his harm.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'character',
    title: 'Good Character',
    icon: <Smile className="w-6 h-6" />,
    bgClass: 'bg-lime-900/30',
    borderClass: 'border-lime-700/50',
    textClass: 'text-lime-400',
    description: 'Even smiling is charity',
    quranVerses: [
      {
        text: 'And speak to people good words.',
        reference: 'Quran 2:83',
      },
      {
        text: 'And indeed, you are of a great moral character.',
        reference: 'Quran 68:4 (about the Prophet ﷺ)',
      },
    ],
    hadith: [
      {
        text: 'Your smiling in the face of your brother is charity.',
        narrator: 'Abu Dharr',
        source: 'Jami\' at-Tirmidhi',
      },
      {
        text: 'The heaviest thing placed on the Scale on the Day of Resurrection will be good character.',
        narrator: 'Abu Darda',
        source: 'Jami\' at-Tirmidhi',
      },
      {
        text: 'I was only sent to perfect good character.',
        narrator: 'Abu Hurairah',
        source: 'Musnad Ahmad',
      },
    ],
  },
  {
    id: 'satan',
    title: 'Reality of Satan',
    icon: <AlertTriangle className="w-6 h-6" />,
    bgClass: 'bg-red-900/30',
    borderClass: 'border-red-700/50',
    textClass: 'text-red-400',
    description: 'Know your enemy',
    conceptExplanation: {
      whatYouMightThink: 'Satan is a cartoon character with horns and a pitchfork, or just a metaphor for "bad thoughts." Not real.',
      whatItActuallyMeans: 'Iblis (Satan) is a real being from the jinn (created from smokeless fire). He was cast out after refusing to bow to Adam out of arrogance. He vowed to mislead all of Adam\'s descendants. He whispers evil suggestions into your heart, makes sins look attractive, and wants you to end up in Hell with him.',
      keyInsight: 'He has NO power to force you to do anything. He can only whisper and make things seem appealing. Your weapon? Say "A\'udhu billahi min ash-shaytan ir-rajim" (I seek refuge in Allah from the accursed Satan). That\'s it. He runs.',
    },
    quranVerses: [
      {
        text: 'Indeed, Satan is an enemy to you; so take him as an enemy. He only invites his followers to become companions of the Blaze.',
        reference: 'Quran 35:6',
      },
      {
        text: 'O children of Adam, let not Satan tempt you as he removed your parents from Paradise.',
        reference: 'Quran 7:27',
      },
      {
        text: 'And if an evil suggestion comes to you from Satan, then seek refuge in Allah. Indeed, He is Hearing and Knowing.',
        reference: 'Quran 7:200',
      },
    ],
    hadith: [
      {
        text: 'Satan flows through the son of Adam like blood flows.',
        narrator: 'Safiyyah bint Huyayy',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'angels',
    title: 'Angels Recording Deeds',
    icon: <BookOpen className="w-6 h-6" />,
    bgClass: 'bg-sky-900/30',
    borderClass: 'border-sky-700/50',
    textClass: 'text-sky-400',
    description: 'Every deed is written',
    conceptExplanation: {
      whatYouMightThink: 'Angels are cute babies with wings on Christmas cards, or mythological beings that don\'t really exist.',
      whatItActuallyMeans: 'Angels (Mala\'ika) are real beings created from light. They have no free will—they only obey Allah. Every person has two angels assigned to them: one on the right recording good deeds, one on the left recording bad deeds. They write down EVERYTHING—every word, every action, every thought you act upon.',
      keyInsight: 'Nothing is secret. That thing you did when you thought no one was watching? Written. That good deed you did quietly? Written. On Judgment Day, you\'ll be handed your book and asked to read it yourself. Your own record will testify against or for you.',
    },
    quranVerses: [
      {
        text: 'And indeed, over you are keepers, noble scribes, who know whatever you do.',
        reference: 'Quran 82:10-12',
      },
      {
        text: 'Man does not utter any word except that with him is an observer prepared to record.',
        reference: 'Quran 50:18',
      },
    ],
    hadith: [
      {
        text: 'The angels of the night and the angels of the day take turns among you. They meet at Fajr and Asr prayers.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'toilet',
    title: 'Toilet Etiquette',
    icon: <Droplets className="w-6 h-6" />,
    bgClass: 'bg-cyan-900/30',
    borderClass: 'border-cyan-700/50',
    textClass: 'text-cyan-400',
    description: 'Even this is covered',
    conceptExplanation: {
      whatYouMightThink: 'Why would a religion have anything to say about going to the bathroom? That\'s private and irrelevant to spirituality.',
      whatItActuallyMeans: 'This is the point—Islam covers EVERYTHING. Enter with left foot, say a dua for protection from evil, use water to clean (not just paper), exit with right foot, say another dua. The Prophet ﷺ taught the companions every detail. Muslims have been using water for hygiene for 1400 years while Europe was still using their hands.',
      keyInsight: 'If the Creator\'s guidance covers even the bathroom, imagine how comprehensive it is for bigger matters. Nothing in your life is outside of Islam. This IS what worship means—following the guidance in every aspect of life.',
    },
    quranVerses: [
      {
        text: 'Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.',
        reference: 'Quran 2:222',
      },
    ],
    hadith: [
      {
        text: 'When entering the toilet, say: "Bismillah, Allahumma inni a\'udhu bika minal-khubthi wal-khaba\'ith" (In the name of Allah, O Allah, I seek refuge in You from male and female evil spirits).',
        narrator: 'Anas ibn Malik',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'Do not face the Qiblah (the direction of the Kaaba in Mecca, which Muslims face during prayer) when relieving yourselves, nor turn your backs to it.',
        narrator: 'Abu Ayyub al-Ansari',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'When one of you goes to relieve himself, let him take three stones to clean himself, for that will suffice.',
        narrator: 'Aisha',
        source: 'Sunan Abu Dawud',
      },
      {
        text: 'The Prophet ﷺ would use water to cleanse himself after relieving himself.',
        narrator: 'Anas ibn Malik',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'When the verse "In it are men who love to purify themselves" (9:108) was revealed praising the people of Quba, the Prophet ﷺ asked them about their purification. They said: "We use water after using stones."',
        narrator: 'Abu Hurairah',
        source: 'Sunan Ibn Majah',
      },
    ],
  },
  {
    id: 'judgment',
    title: 'Day of Judgment',
    icon: <Scale className="w-6 h-6" />,
    bgClass: 'bg-slate-800/50',
    borderClass: 'border-slate-600',
    textClass: 'text-slate-300',
    description: 'The ultimate accountability',
    quranVerses: [
      {
        text: 'So whoever does an atom\'s weight of good will see it, and whoever does an atom\'s weight of evil will see it.',
        reference: 'Quran 99:7-8',
      },
      {
        text: 'And We place the scales of justice for the Day of Resurrection, so no soul will be treated unjustly at all.',
        reference: 'Quran 21:47',
      },
    ],
    hadith: [
      {
        text: 'You will certainly be questioned about your youth and how you spent it, your life and how you used it, your wealth and how you earned it and spent it, and your body and how you utilized it.',
        narrator: 'Ibn Mas\'ud',
        source: 'Jami\' at-Tirmidhi',
      },
    ],
  },
  {
    id: 'book-of-deeds',
    title: 'The Book of Deeds',
    icon: <BookOpen className="w-6 h-6" />,
    bgClass: 'bg-amber-900/30',
    borderClass: 'border-amber-700/50',
    textClass: 'text-amber-400',
    description: 'Your record, right hand or left',
    conceptExplanation: {
      whatYouMightThink: 'God will judge arbitrarily, or maybe there\'s no real accountability after death.',
      whatItActuallyMeans: 'Every deed is recorded. On the Day of Judgment, you will receive your book of deeds. If given in your RIGHT hand—you will rejoice saying "Here, read my book!" If given in your LEFT hand or behind your back—your face will be downcast with regret. These are the "People of the Right" and the "People of the Left."',
      keyInsight: 'But here\'s the mercy: Allah MULTIPLIES your good deeds (10x, 700x, or more) while only recording bad deeds ONCE. And sincere repentance WIPES OUT sins entirely. He makes it hard for you to fail. The goal isn\'t your test result—Allah judges you on your EFFORT. Everyone has a different test of varying difficulty.',
    },
    quranVerses: [
      {
        arabic: 'فَأَمَّا مَنْ أُوتِيَ كِتَابَهُ بِيَمِينِهِ فَيَقُولُ هَاؤُمُ اقْرَءُوا كِتَابِيَهْ',
        text: 'As for he who is given his record in his right hand, he will say, "Here, read my record!"',
        reference: 'Quran 69:19',
      },
      {
        arabic: 'وَأَمَّا مَنْ أُوتِيَ كِتَابَهُ بِشِمَالِهِ فَيَقُولُ يَا لَيْتَنِي لَمْ أُوتَ كِتَابِيَهْ',
        text: 'But as for he who is given his record in his left hand, he will say, "I wish I had not been given my record."',
        reference: 'Quran 69:25',
      },
      {
        text: 'Whoever comes with a good deed will have ten times the like thereof, and whoever comes with an evil deed will not be recompensed except the like thereof.',
        reference: 'Quran 6:160',
      },
      {
        text: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."',
        reference: 'Quran 39:53',
      },
    ],
    hadith: [
      {
        text: 'A man will be brought and his scrolls of bad deeds will be spread out. He will think he is doomed. Then a small card will be brought with "La ilaha illallah" (There is no god but Allah) written on it. He will say, "What is this card compared to all these scrolls?" But the card will outweigh them all.',
        narrator: 'Abdullah ibn Amr',
        source: 'Jami\' at-Tirmidhi',
      },
      {
        text: 'Allah will bring the believer close and cover him, asking "Do you recognize this sin? Do you recognize that sin?" He will say yes. When he thinks he is doomed, Allah will say: "I concealed it for you in the world, and today I forgive you for it."',
        narrator: 'Ibn Umar',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'No one who has an atom\'s weight of faith in their heart will remain in the Fire forever.',
        narrator: 'Abu Sa\'id al-Khudri',
        source: 'Sahih Muslim',
      },
    ],
  },
  {
    id: 'fear-and-hope',
    title: 'Fear & Hope',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-violet-900/30',
    borderClass: 'border-violet-700/50',
    textClass: 'text-violet-400',
    description: 'The two wings of faith',
    conceptExplanation: {
      whatYouMightThink: 'Either God is scary and I should be terrified, or God is merciful so I can do whatever I want.',
      whatItActuallyMeans: 'A believer needs BOTH fear and hope—like two wings of a bird. Too much fear leads to despair. Too much hope leads to carelessness. The balance keeps you striving without losing hope in Allah\'s mercy.',
      keyInsight: 'Remember: Allah doesn\'t judge your test RESULTS—He judges your EFFORT. Everyone has a different test of varying difficulty. A person struggling with one sin while trying hard is better than someone with an easy test who doesn\'t try. Keep pushing, keep repenting, and never lose hope.',
    },
    quranVerses: [
      {
        text: 'Call upon Him with fear and hope. Indeed, the mercy of Allah is near to the doers of good.',
        reference: 'Quran 7:56',
      },
      {
        text: 'Indeed, those who believed and those who emigrated and strived in the cause of Allah—those expect the mercy of Allah. And Allah is Forgiving and Merciful.',
        reference: 'Quran 2:218',
      },
    ],
    hadith: [
      {
        text: 'If the believer knew what punishment Allah has, he would never hope for Paradise. And if the disbeliever knew what mercy Allah has, he would never despair of Paradise.',
        narrator: 'Abu Hurairah',
        source: 'Sahih Muslim',
      },
      {
        text: 'Allah says: "I am as My servant thinks of Me. So let him think of Me as he wishes."',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'fasting',
    title: 'Fasting (Sawm)',
    icon: <Clock className="w-6 h-6" />,
    bgClass: 'bg-orange-900/30',
    borderClass: 'border-orange-700/50',
    textClass: 'text-orange-400',
    description: 'Training the soul',
    conceptExplanation: {
      whatYouMightThink: 'Fasting is just starving yourself for religious tradition, or a way to lose weight.',
      whatItActuallyMeans: 'Fasting in Ramadan (the 9th month of the Islamic calendar) means no food, drink, or intimacy from dawn to sunset. But more importantly, it\'s training for your soul—learning to say NO to your desires. If you can control yourself from what is normally halal (permitted), you can control yourself from what is haram (forbidden).',
      keyInsight: 'The reward is unique: Allah says "Fasting is for Me, and I will reward it." Unlike other deeds with set rewards, fasting\'s reward is limitless because it\'s done purely between you and Allah—no one else knows if you secretly ate. It builds taqwa (God-consciousness) and empathy for the poor.',
    },
    quranVerses: [
      {
        arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
        text: 'O you who believe, fasting is prescribed for you as it was prescribed for those before you, that you may become righteous (develop taqwa).',
        reference: 'Quran 2:183',
      },
      {
        text: 'The month of Ramadan in which the Quran was revealed as guidance for the people and clear proofs of guidance and criterion.',
        reference: 'Quran 2:185',
      },
    ],
    hadith: [
      {
        text: 'Allah said: "Every deed of the son of Adam is for him except fasting—it is for Me, and I shall reward it."',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'Fasting is a shield. When one of you is fasting, let him not speak obscenely or act ignorantly. If someone insults him, let him say: "I am fasting."',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'The fasting person has two joys: joy when he breaks his fast, and joy when he meets his Lord.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'The smell of the fasting person\'s mouth is more pleasant to Allah than the fragrance of musk.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
  {
    id: 'modesty',
    title: 'Modesty & Hijab',
    icon: <Shield className="w-6 h-6" />,
    bgClass: 'bg-pink-900/30',
    borderClass: 'border-pink-700/50',
    textClass: 'text-pink-400',
    description: 'For men AND women',
    conceptExplanation: {
      whatYouMightThink: 'Hijab is just for women, and it\'s oppressive. Men can do whatever they want.',
      whatItActuallyMeans: 'Modesty applies to BOTH genders. Men are commanded FIRST in the Quran to lower their gaze and guard their chastity. Women are then commanded similarly, plus to cover their adornment. The hijab (covering) protects society from objectification—valuing people for their character, not their appearance.',
      keyInsight: 'Men must: lower their gaze, dress modestly (cover navel to knee minimum), not display their bodies to attract attention. Women must: lower their gaze, cover everything except face and hands, not display their beauty to non-mahram (non-family) men. Both are protecting themselves AND each other. It\'s mutual respect, not oppression.',
    },
    quranVerses: [
      {
        arabic: 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ',
        text: 'Tell the believing MEN to lower their gaze and guard their chastity. That is purer for them.',
        reference: 'Quran 24:30',
      },
      {
        arabic: 'وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ وَيَحْفَظْنَ فُرُوجَهُنَّ وَلَا يُبْدِينَ زِينَتَهُنَّ إِلَّا مَا ظَهَرَ مِنْهَا',
        text: 'And tell the believing WOMEN to lower their gaze and guard their chastity and not display their adornment except what is apparent.',
        reference: 'Quran 24:31',
      },
      {
        text: 'O Prophet, tell your wives and your daughters and the women of the believers to bring down over themselves their outer garments. That is more suitable that they will be known (as respectable women) and not be abused.',
        reference: 'Quran 33:59',
      },
    ],
    hadith: [
      {
        text: 'Modesty (haya) is part of faith.',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'Modesty does not bring anything except good.',
        narrator: 'Imran ibn Husayn',
        source: 'Sahih al-Bukhari',
      },
      {
        text: 'Every religion has a distinct characteristic, and the characteristic of Islam is modesty.',
        narrator: 'Anas ibn Malik',
        source: 'Sunan Ibn Majah',
      },
      {
        text: 'O Ali, do not let a (second) look follow the first. The first is for you (unintentional) but the second is not.',
        narrator: 'Ali ibn Abi Talib',
        source: 'Sunan Abu Dawud',
      },
    ],
  },
  {
    id: 'paradise',
    title: 'Description of Paradise',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-green-900/30',
    borderClass: 'border-green-700/50',
    textClass: 'text-green-400',
    description: 'What awaits the believers',
    quranVerses: [
      {
        text: 'And no soul knows what has been hidden for them of comfort for eyes as reward for what they used to do.',
        reference: 'Quran 32:17',
      },
      {
        text: 'For them therein is whatever they wish, and with Us is more.',
        reference: 'Quran 50:35',
      },
      {
        text: 'Gardens beneath which rivers flow, wherein they abide eternally. Allah is pleased with them, and they are pleased with Him.',
        reference: 'Quran 98:8',
      },
    ],
    hadith: [
      {
        text: 'Allah said: "I have prepared for My righteous servants what no eye has seen, no ear has heard, and no human heart has conceived."',
        narrator: 'Abu Hurairah',
        source: 'Sahih al-Bukhari & Muslim',
      },
    ],
  },
  {
    id: 'hellfire',
    title: 'Description of Hell',
    icon: <Flame className="w-6 h-6" />,
    bgClass: 'bg-red-950/50',
    borderClass: 'border-red-800/50',
    textClass: 'text-red-500',
    description: 'The warning for disbelievers',
    quranVerses: [
      {
        text: 'Indeed, those who disbelieve, neither their wealth nor their children will avail them against Allah at all, and those are the companions of the Fire; they will abide therein eternally.',
        reference: 'Quran 3:116',
      },
      {
        text: 'The Fire whose fuel is people and stones.',
        reference: 'Quran 2:24',
      },
    ],
    hadith: [
      {
        text: 'The least punished person of the people of Hell on the Day of Resurrection will be a man under whose feet will be placed two embers of fire, and his brain will boil because of them.',
        narrator: 'An-Nu\'man ibn Bashir',
        source: 'Sahih al-Bukhari',
      },
    ],
  },
];

// FAQs with answers from Quran and Sunnah
interface FAQ {
  question: string;
  answer: string;
  sources: Array<{
    text: string;
    reference: string;
    type: 'quran' | 'hadith';
  }>;
}

const faqs: FAQ[] = [
  {
    question: 'Why does God need our worship?',
    answer: 'Allah does not NEED anything. He is self-sufficient. Worship benefits US, not Him. Prayer keeps us connected, grateful, and humble. Without it, we become arrogant and forget our purpose. It\'s like asking "why does a doctor need you to take medicine?" He doesn\'t—YOU need it.',
    sources: [
      { text: 'O mankind, you are those in need of Allah, while Allah is the Free of need, the Praiseworthy.', reference: 'Quran 35:15', type: 'quran' },
      { text: 'If you disbelieve, indeed, Allah is Free from need of you.', reference: 'Quran 39:7', type: 'quran' },
    ],
  },
  {
    question: 'If God is merciful, why is there Hell?',
    answer: 'Justice requires consequences. If Hitler and a saint get the same end, that\'s not mercy—it\'s injustice. Hell exists because Allah is JUST. But His mercy is vast—He forgives all sins if you sincerely repent before death. The door is always open. Hell is for those who arrogantly refuse.',
    sources: [
      { text: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."', reference: 'Quran 39:53', type: 'quran' },
      { text: 'My mercy prevails over My wrath.', reference: 'Hadith Qudsi - Sahih al-Bukhari', type: 'hadith' },
    ],
  },
  {
    question: 'Why can\'t I just be a good person without religion?',
    answer: '"Good" according to whom? Your definition? Society\'s? These change over time. Slavery was once "acceptable." The Creator defines what\'s actually good and evil. Also, being "good" isn\'t the full picture—you were created to KNOW and WORSHIP your Creator. A "good" child who ignores their parents entirely isn\'t truly good.',
    sources: [
      { text: 'Do you order righteousness of the people and forget yourselves while you recite the Scripture? Then will you not reason?', reference: 'Quran 2:44', type: 'quran' },
      { text: 'Whoever does righteousness, whether male or female, while being a believer—those will enter Paradise.', reference: 'Quran 4:124', type: 'quran' },
    ],
  },
  {
    question: 'Why do bad things happen to good people?',
    answer: 'This world is a TEST, not Paradise. Tests are supposed to be hard. Hardship expiates sins, raises ranks in the afterlife, and teaches us patience. The Prophet ﷺ—the best human ever—suffered the most. The real question is: what happens AFTER this test? That\'s eternal.',
    sources: [
      { text: 'Do people think they will be left alone because they say "We believe" and will not be tested?', reference: 'Quran 29:2', type: 'quran' },
      { text: 'The greatest reward comes with the greatest trial. When Allah loves a people, He tests them.', reference: 'Jami\' at-Tirmidhi', type: 'hadith' },
    ],
  },
  {
    question: 'What about people who never heard of Islam?',
    answer: 'Allah is absolutely just. No one will be punished for what they didn\'t know. Those who never received the message clearly will be tested on Judgment Day. Allah knows exactly what each person knew and had access to. You, however, are now hearing this...',
    sources: [
      { text: 'We never punish until We have sent a messenger.', reference: 'Quran 17:15', type: 'quran' },
      { text: 'Allah does not burden a soul beyond that it can bear.', reference: 'Quran 2:286', type: 'quran' },
    ],
  },
  {
    question: 'Why are there different religions then?',
    answer: 'There was only ONE religion from Allah: submit to the One God (Islam = submission). But humans changed the message over time, adding their own ideas, elevating prophets to gods, worshipping statues. The Quran is the final, preserved message to correct these corruptions.',
    sources: [
      { text: 'Indeed, the religion in the sight of Allah is Islam.', reference: 'Quran 3:19', type: 'quran' },
      { text: 'We have sent among every nation a messenger saying: "Worship Allah and avoid false gods."', reference: 'Quran 16:36', type: 'quran' },
    ],
  },
  {
    question: 'Why do Muslims pray in Arabic?',
    answer: 'The Quran was revealed in Arabic, and that\'s the exact language preserved. Translations are interpretations, not the original words of God. When you pray in Arabic, you\'re reciting the EXACT words revealed to Muhammad ﷺ. You can make personal dua (supplication) in any language.',
    sources: [
      { text: 'Indeed, We have sent it down as an Arabic Quran that you might understand.', reference: 'Quran 12:2', type: 'quran' },
      { text: 'Indeed, it is We who sent down the Reminder and indeed, We will be its guardian.', reference: 'Quran 15:9', type: 'quran' },
    ],
  },
  {
    question: 'Is Islam violent?',
    answer: 'Islam literally means "peace through submission to God." Fighting is only permitted in self-defense or to protect the oppressed—with strict rules (no civilians, no trees, no excessive force). The Prophet ﷺ forgave the people of Makkah who tortured Muslims for 13 years. Context matters.',
    sources: [
      { text: 'Fight in the way of Allah those who fight you but do not transgress. Indeed, Allah does not like transgressors.', reference: 'Quran 2:190', type: 'quran' },
      { text: 'If anyone killed a person—not in retaliation of murder, or to spread mischief in the land—it would be as if he killed all mankind.', reference: 'Quran 5:32', type: 'quran' },
    ],
  },
  {
    question: 'Why do women wear hijab?',
    answer: 'Hijab is commanded by Allah for modesty and dignity—not oppression. It\'s similar to how a queen is covered while slaves are exposed. It protects women from being valued only for their bodies. Mary, mother of Jesus, is depicted with hijab in Christian art. It\'s a choice to obey God.',
    sources: [
      { text: 'Tell the believing women to reduce some of their vision and guard their private parts and not expose their adornment except that which appears thereof and to wrap their headcovers over their chests.', reference: 'Quran 24:31', type: 'quran' },
      { text: 'O Prophet, tell your wives and your daughters and the women of the believers to bring down over themselves part of their outer garments. That is more suitable that they will be known and not be abused.', reference: 'Quran 33:59', type: 'quran' },
    ],
  },
  {
    question: 'Can I still enjoy life as a Muslim?',
    answer: 'Absolutely! Islam doesn\'t forbid enjoyment—it guides it. Eat good food (halal), get married, have fun with family, play sports, travel, enjoy nature. What\'s forbidden is what HARMS you (alcohol, drugs, gambling, adultery). The Prophet ﷺ joked, raced with his wife, and enjoyed life.',
    sources: [
      { text: 'Say, "Who has forbidden the adornment of Allah which He has produced for His servants and the good things of provision?"', reference: 'Quran 7:32', type: 'quran' },
      { text: 'He used to joke and say nothing but the truth.', reference: 'Jami\' at-Tirmidhi', type: 'hadith' },
    ],
  },
  {
    question: 'What are the "Hoor al-Ayn" in Paradise?',
    answer: 'Hoor al-Ayn are companions in Paradise, described with beautiful attributes. But Paradise isn\'t just about this—it contains "what no eye has seen, no ear has heard, and no mind has imagined." The real prize is seeing Allah\'s Face and His pleasure. Women in Paradise also receive companions and blessings. The descriptions use language humans can relate to, but the reality is beyond our comprehension.',
    sources: [
      { text: 'And with them will be women limiting their glances, with large, beautiful eyes.', reference: 'Quran 37:48', type: 'quran' },
      { text: 'Allah has prepared for His righteous servants what no eye has seen, no ear has heard, and no human heart has conceived.', reference: 'Sahih al-Bukhari', type: 'hadith' },
      { text: 'Some faces that Day will be radiant, looking at their Lord.', reference: 'Quran 75:22-23', type: 'quran' },
    ],
  },
  {
    question: 'How did Mary have a child without a man?',
    answer: 'Allah simply said "Be" and it was. The One who created Adam from dust without ANY parents can certainly create Jesus from a mother alone. If you believe God created the entire universe, why would creating one human without a father be difficult for Him? Muslims honour Mary (Maryam) as one of the best women ever created.',
    sources: [
      { text: 'She said, "My Lord, how will I have a child when no man has touched me?" He said, "Such is Allah; He creates what He wills. When He decrees a matter, He only says to it, \'Be,\' and it is."', reference: 'Quran 3:47', type: 'quran' },
      { text: 'Indeed, the example of Jesus to Allah is like that of Adam. He created him from dust; then He said to him, "Be," and he was.', reference: 'Quran 3:59', type: 'quran' },
    ],
  },
  {
    question: 'What happens when you die?',
    answer: 'The soul is taken by the Angel of Death. In the grave, you\'re questioned by two angels: Who is your Lord? What is your religion? Who is your Prophet? Believers answer correctly and their grave becomes a garden of Paradise. Disbelievers cannot answer and face punishment until Resurrection. Then everyone is raised for Judgment Day.',
    sources: [
      { text: 'Say, "The angel of death who has been entrusted with you will take your soul; then to your Lord you will be returned."', reference: 'Quran 32:11', type: 'quran' },
      { text: 'When a believer is about to depart this world and enter the Hereafter, angels with white faces come down to him... A disbeliever, angels with black faces come down to him...', reference: 'Sahih - Musnad Ahmad', type: 'hadith' },
    ],
  },
  {
    question: 'Why don\'t men have to cover like women?',
    answer: 'Men DO have covering requirements—from navel to knee at minimum, and modest clothing generally. The difference exists because men and women are biologically different in what attracts attention. Islam acknowledges natural differences while honouring both genders. Men also have restrictions women don\'t have (gold, silk forbidden). Different doesn\'t mean unequal.',
    sources: [
      { text: 'Tell the believing men to lower their gaze and guard their private parts. That is purer for them.', reference: 'Quran 24:30', type: 'quran' },
      { text: 'The Prophet ﷺ said about a man\'s awrah (what must be covered): "What is between the navel and the knee."', reference: 'Sunan Abu Dawud', type: 'hadith' },
    ],
  },
  {
    question: 'Why can a man marry up to 4 wives?',
    answer: 'In Islam, a man may marry up to 4 wives with strict conditions: you MUST treat all wives equally in time, money, and treatment. If you can\'t be just, then only one. It was revealed after a battle that left many widows and orphans needing protection. Most Muslim men have one wife. Allah knows His creation—in His wisdom, the rules accommodate what either spouse may desire. Some women prefer to be in a polygamous marriage rather than remain unmarried, and some men have the capacity for it. In some parts of the world (like parts of Africa), having multiple wives is normal; in Europe, it\'s the opposite. Islam provides a universal rule that works everywhere. Now here\'s the key point: previous scriptures did NOT limit the number of wives at all. In the Bible, Solomon had 700 wives and 300 concubines, David had multiple wives, Abraham had Sarah and Hagar. Islam actually came to LIMIT this and bring an achievable rule—just like alcohol was not prohibited until the final revelation.',
    sources: [
      { text: 'And if you fear that you will not deal justly with the orphan girls, then marry those that please you of other women, two or three or four. But if you fear that you will not be just, then marry only one.', reference: 'Quran 4:3', type: 'quran' },
      { text: 'You will never be able to be equal between wives, even if you should strive to do so.', reference: 'Quran 4:129', type: 'quran' },
      { text: 'King Solomon had 700 wives of royal birth and 300 concubines.', reference: '1 Kings 11:3 (Bible)', type: 'quran' },
    ],
  },
  {
    question: 'Why is alcohol prohibited in Islam but not in other religions?',
    answer: 'Alcohol was NOT prohibited in previous scriptures—this rule came with the final revelation. The Bible contains stories mentioning wine positively, but here\'s the thing: we cannot verify what is true or false in those scriptures since they have been altered over time. We can only confirm what the Quran confirms. What we DO know is that the previous scriptures, as they exist today, did not forbid alcohol. Islam came to complete and perfect the guidance. Allah prohibited alcohol because He knows the harm it causes: broken families, addiction, violence, impaired judgment, health problems, and wasted wealth. The prohibition was revealed gradually—first discouraging it, then prohibiting prayer while intoxicated, and finally a complete ban. This gradual approach shows Allah\'s mercy in helping people overcome addiction. Today, science confirms what Islam taught 1400 years ago: alcohol is harmful. Many non-Muslims now choose sobriety. The Creator knew best all along.',
    sources: [
      { text: 'O you who believe, indeed intoxicants, gambling, stone altars, and divining arrows are but defilement from the work of Satan, so avoid it that you may be successful.', reference: 'Quran 5:90', type: 'quran' },
      { text: 'Satan only wants to cause between you animosity and hatred through intoxicants and gambling and to avert you from the remembrance of Allah and from prayer. So will you not desist?', reference: 'Quran 5:91', type: 'quran' },
      { text: 'Every intoxicant is khamr (alcohol), and every intoxicant is forbidden.', reference: 'Sahih Muslim', type: 'hadith' },
      { text: 'Whatever intoxicates in large quantities, a small quantity of it is also forbidden.', reference: 'Sunan Abu Dawud', type: 'hadith' },
    ],
  },
];

export const CheatCodes = ({ verifiedCount, totalFacts, onComplete }: CheatCodesProps) => {
  const [stage, setStage] = useState<'intro' | 'topics' | 'faqs'>('intro');
  const [selectedTopic, setSelectedTopic] = useState<LifeGuidance | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(faq => {
    if (!faqSearch.trim()) return true;
    const searchLower = faqSearch.toLowerCase();
    return (
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower) ||
      faq.sources.some(s => s.text.toLowerCase().includes(searchLower))
    );
  });

  // Intro screen
  if (stage === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">
              But What About My Life?
            </h1>

            <p className="text-lg text-purple-200 mb-8">
              The Quran has scientific miracles—but what does it say about what actually concerns me?
            </p>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                This is the <span className="text-purple-400 font-semibold">Creator's manual</span> for human life. It covers <span className="text-white font-medium">everything</span>—from the purpose of existence to how to use the toilet.
              </p>

              <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-700/50 mb-6">
                <p className="text-purple-200 italic">
                  "We have not neglected anything in the Book."
                </p>
                <p className="text-slate-500 text-sm mt-2">— Quran 6:38</p>
              </div>

              <p className="text-slate-300 leading-relaxed mb-6">
                But here's the thing: the Quran <span className="text-white font-medium">always came with a human example</span> of how to implement its teachings.
              </p>

              {/* The Prophet's example */}
              <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-6">
                <p className="text-amber-200 leading-relaxed mb-3">
                  We have preserved <span className="text-white font-semibold">narrations and sayings</span> of the Prophet Muhammad ﷺ using a rigorous <span className="text-white font-semibold">science of chain of narration</span> (Isnad)—tracing every quote back through verified witnesses.
                </p>
                <p className="text-amber-200 leading-relaxed">
                  So we don't just have the Quran telling us <span className="text-white">what</span> to do—we have the human example showing us <span className="text-white">how</span> to actually implement each and every action.
                </p>
              </div>

              {/* Terminology */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-purple-300 font-semibold mb-1">Hadith</p>
                  <p className="text-slate-400 text-sm">The narrations—what the Prophet said or approved</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-purple-300 font-semibold mb-1">Sunnah</p>
                  <p className="text-slate-400 text-sm">The way of the Prophet—what he did and how he lived</p>
                </div>
              </div>

              {/* Obey Allah and the Prophet */}
              <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-6">
                <p className="text-emerald-300 font-arabic text-center text-lg mb-2" dir="rtl">
                  يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ
                </p>
                <p className="text-white italic text-center text-sm mb-2">
                  "O you who believe, obey Allah and obey the Messenger."
                </p>
                <p className="text-slate-500 text-xs text-center">— Surah An-Nisa, 4:59</p>
              </div>

              <p className="text-slate-300 leading-relaxed mb-6">
                We follow <span className="text-white font-medium">Allah and the Prophet Muhammad ﷺ</span> since he is in our era. We don't make up our own interpretations of verses—we look to how the Prophet understood and applied them.
              </p>

              <p className="text-slate-300 leading-relaxed mb-6">
                We must hold onto <span className="text-purple-400 font-semibold">both the Quran and the Sunnah</span> to avoid falling into the same mistakes as the nations of past prophets.
              </p>

              {/* Warning about sects */}
              <div className="bg-rose-900/30 rounded-xl p-5 border border-rose-700/50">
                <p className="text-rose-200 leading-relaxed mb-3">
                  Even with this clear guidance, the Prophet ﷺ warned us:
                </p>
                <p className="text-white italic text-center mb-2">
                  "My ummah will split into 73 sects—all of them in the Fire except one."
                </p>
                <p className="text-rose-200 leading-relaxed text-center mb-2">
                  They asked: "Which one, O Messenger of Allah?"
                </p>
                <p className="text-white italic text-center">
                  "The one that follows what I and my companions are upon today."
                </p>
                <p className="text-slate-500 text-xs text-center mt-2">— Hadith (Tirmidhi)</p>
              </div>
            </div>

            <button
              onClick={() => setStage('topics')}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Show Me
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Topic detail view
  if (selectedTopic) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4"
      >
        {/* Back button */}
        <button
          onClick={() => setSelectedTopic(null)}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl mx-auto pt-16">
          {/* Header */}
          <div className={`${selectedTopic.bgClass} rounded-2xl p-6 border ${selectedTopic.borderClass} mb-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={selectedTopic.textClass}>{selectedTopic.icon}</div>
              <h2 className="text-2xl font-serif text-white">{selectedTopic.title}</h2>
            </div>
            <p className="text-slate-400">{selectedTopic.description}</p>
          </div>

          {/* Concept Explanation - What You Might Think vs Reality */}
          {selectedTopic.conceptExplanation && (
            <div className="mb-6 space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-sm font-medium">What you might think:</span>
                </div>
                <p className="text-slate-400 italic">{selectedTopic.conceptExplanation.whatYouMightThink}</p>
              </div>

              <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-400 text-sm font-medium">What it actually means in Islam:</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{selectedTopic.conceptExplanation.whatItActuallyMeans}</p>
              </div>

              {selectedTopic.conceptExplanation.keyInsight && (
                <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">Key insight:</span>
                  </div>
                  <p className="text-purple-200">{selectedTopic.conceptExplanation.keyInsight}</p>
                </div>
              )}
            </div>
          )}

          {/* Quran Verses */}
          <div className="mb-6">
            <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              From the Quran
            </h3>
            <div className="space-y-3">
              {selectedTopic.quranVerses.map((verse, idx) => (
                <div key={idx} className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
                  {verse.arabic && (
                    <p className="text-2xl text-emerald-200 font-arabic text-right mb-3 leading-loose">
                      {verse.arabic}
                    </p>
                  )}
                  <p className="text-slate-200 italic leading-relaxed">"{verse.text}"</p>
                  <p className="text-emerald-400 text-sm mt-2">— {verse.reference}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hadith */}
          <div className="mb-8">
            <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              From the Prophet ﷺ (Authentic Hadith)
            </h3>
            <div className="space-y-3">
              {selectedTopic.hadith.map((h, idx) => (
                <div key={idx} className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/30">
                  <p className="text-slate-200 italic leading-relaxed">"{h.text}"</p>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-slate-500">Narrated by {h.narrator}</span>
                    <span className="text-amber-400">{h.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back to topics */}
          <div className="text-center">
            <button
              onClick={() => setSelectedTopic(null)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition"
            >
              Explore More Topics
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // FAQs screen
  if (stage === 'faqs') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4"
      >
        {/* Back button */}
        <button
          onClick={() => setStage('topics')}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl mx-auto pt-16">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">
              Common Questions
            </h2>
            <p className="text-slate-400">
              Answers from the Quran and authentic Sunnah
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions... (e.g. hijab, hell, pray)"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {faqSearch && (
              <button
                onClick={() => setFaqSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results count */}
          {faqSearch && (
            <p className="text-slate-500 text-sm mb-4">
              {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* FAQs */}
          <div className="space-y-3 mb-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No questions match your search.</p>
                <button
                  onClick={() => setFaqSearch('')}
                  className="text-indigo-400 hover:text-indigo-300 mt-2 text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-900/70 rounded-xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-4 text-left hover:bg-slate-800/50 transition flex items-center justify-between"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                    className="text-slate-400 flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-slate-700">
                        <p className="text-slate-300 leading-relaxed mb-4">
                          {faq.answer}
                        </p>

                        <div className="space-y-2">
                          {faq.sources.map((source, sIdx) => (
                            <div
                              key={sIdx}
                              className={`rounded-lg p-3 ${
                                source.type === 'quran'
                                  ? 'bg-emerald-900/20 border border-emerald-700/30'
                                  : 'bg-amber-900/20 border border-amber-700/30'
                              }`}
                            >
                              <p className="text-slate-200 text-sm italic">"{source.text}"</p>
                              <p className={`text-xs mt-1 ${
                                source.type === 'quran' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                — {source.reference}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Continue button */}
          <div className="text-center">
            <button
              onClick={onComplete}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Topics grid
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">
            What Does the Creator Say About...
          </h2>
          <p className="text-slate-400">
            Tap any topic to see Quran verses and authentic hadith
          </p>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {lifeGuidanceTopics.map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedTopic(topic)}
              className={`${topic.bgClass} rounded-xl p-4 border ${topic.borderClass} text-left hover:scale-105 transition-transform ${
                topic.halfWidth ? 'col-span-1 sm:col-span-1 lg:col-span-2' : ''
              }`}
            >
              <div className={`${topic.textClass} mb-2`}>{topic.icon}</div>
              <h3 className={`text-white font-medium mb-1 ${topic.halfWidth ? 'text-base' : 'text-sm'}`}>{topic.title}</h3>
              <p className={`text-slate-500 ${topic.halfWidth ? 'text-sm' : 'text-xs'}`}>{topic.description}</p>
            </motion.button>
          ))}
        </div>

        {/* FAQs Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setStage('faqs')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition flex items-center justify-center gap-2 mx-auto"
          >
            <HelpCircle className="w-5 h-5" />
            Common Questions (FAQs)
          </button>
        </div>

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CheatCodes;
