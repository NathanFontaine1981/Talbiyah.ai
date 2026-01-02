import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Book, Users, AlertTriangle, Clock } from 'lucide-react';

interface ProphetTimelineProps {
  onComplete: () => void;
  onBack?: () => void;
}

interface Scripture {
  text: string;
  source: string;
  speaker: string; // 'God' | 'Prophet' | 'Angel'
}

interface Prophet {
  id: string;
  name: string;
  arabicName: string;
  era: string;
  color: string;
  bgColor: string;
  borderColor: string;
  revelation?: string;
  message: string;
  mustBelieveIn: string[];
  additionalNote?: string;
  scriptures?: Scripture[];
}

const prophets: Prophet[] = [
  {
    id: 'adam',
    name: 'Adam',
    arabicName: 'آدم',
    era: 'The Beginning',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-600',
    message: 'Worship God alone. I am the first human—your example.',
    mustBelieveIn: [],
    scriptures: [
      {
        text: 'And the LORD God commanded the man, saying, "Of every tree of the garden you may freely eat; but of the tree of the knowledge of good and evil you shall not eat."',
        source: 'Genesis 2:16-17',
        speaker: 'God',
      },
    ],
  },
  {
    id: 'noah',
    name: 'Noah',
    arabicName: 'نوح',
    era: 'Era of Noah',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    message: 'Worship God alone and follow me as your human example.',
    mustBelieveIn: ['Adam'],
    additionalNote: 'If you lived in this era and believed this, you were a Muslim—one who submits to God.',
    scriptures: [
      {
        text: 'Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God.',
        source: 'Genesis 6:9',
        speaker: 'God',
      },
    ],
  },
  {
    id: 'abraham',
    name: 'Abraham',
    arabicName: 'إبراهيم',
    era: 'Era of Abraham',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700/50',
    revelation: 'Scrolls of Abraham',
    message: 'Worship God alone and follow me. I submit fully to Him.',
    mustBelieveIn: ['Adam', 'Noah'],
    additionalNote: 'Abraham is called the father of the prophets. Jews, Christians, and Muslims all trace back to him.',
    scriptures: [
      {
        text: 'I am God Almighty; walk before me faithfully and be blameless.',
        source: 'Genesis 17:1',
        speaker: 'God',
      },
      {
        text: 'Abraham believed the LORD, and he credited it to him as righteousness.',
        source: 'Genesis 15:6',
        speaker: 'God',
      },
    ],
  },
  {
    id: 'moses',
    name: 'Moses',
    arabicName: 'موسى',
    era: 'Era of Moses',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-700/50',
    revelation: 'The Torah',
    message: 'Worship God alone and follow the law given to me.',
    mustBelieveIn: ['Adam', 'Noah', 'Abraham'],
    additionalNote: 'The Torah was the revelation for the Children of Israel. Those who followed it were Muslims of their time.',
    scriptures: [
      {
        text: 'I am the LORD your God... You shall have no other gods before me.',
        source: 'Exodus 20:2-3',
        speaker: 'God',
      },
      {
        text: 'Hear, O Israel: The LORD our God, the LORD is one. Love the LORD your God with all your heart and with all your soul and with all your strength.',
        source: 'Deuteronomy 6:4-5',
        speaker: 'Moses',
      },
      {
        text: 'The LORD your God will raise up for you a prophet like me from among you, from your fellow Israelites. You must listen to him.',
        source: 'Deuteronomy 18:15',
        speaker: 'Moses',
      },
    ],
  },
  {
    id: 'jesus',
    name: 'Jesus',
    arabicName: 'عيسى',
    era: 'Era of Jesus',
    color: 'text-rose-400',
    bgColor: 'bg-rose-900/30',
    borderColor: 'border-rose-700/50',
    revelation: 'The Gospel (Injeel)',
    message: 'Worship God alone. I came to confirm the Torah and guide you.',
    mustBelieveIn: ['Adam', 'Noah', 'Abraham', 'Moses'],
    additionalNote: 'Jesus said he came to uphold the law of Moses. Those who accepted him and still believed in Moses were the true followers.',
    scriptures: [
      {
        text: 'This is eternal life: that they know you, the only true God, and Jesus Christ, whom you have sent.',
        source: 'John 17:3',
        speaker: 'Jesus',
      },
      {
        text: 'The most important commandment is this: "Hear, O Israel: The Lord our God, the Lord is one. Love the Lord your God with all your heart..."',
        source: 'Mark 12:29-30',
        speaker: 'Jesus',
      },
      {
        text: 'Why do you call me good? No one is good—except God alone.',
        source: 'Mark 10:18',
        speaker: 'Jesus',
      },
      {
        text: 'My teaching is not my own. It comes from the one who sent me.',
        source: 'John 7:16',
        speaker: 'Jesus',
      },
      {
        text: 'I am ascending to my Father and your Father, to my God and your God.',
        source: 'John 20:17',
        speaker: 'Jesus',
      },
      {
        text: 'The Father is greater than I.',
        source: 'John 14:28',
        speaker: 'Jesus',
      },
      {
        text: 'By myself I can do nothing; I judge only as I hear, and my judgment is just, for I seek not to please myself but him who sent me.',
        source: 'John 5:30',
        speaker: 'Jesus',
      },
      {
        text: 'Do not think that I have come to abolish the Law or the Prophets; I have not come to abolish them but to fulfill them.',
        source: 'Matthew 5:17',
        speaker: 'Jesus',
      },
      {
        text: 'Away from me, Satan! For it is written: "Worship the Lord your God, and serve him only."',
        source: 'Matthew 4:10',
        speaker: 'Jesus',
      },
      {
        text: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done...',
        source: 'Matthew 6:9-10',
        speaker: 'Jesus',
      },
      {
        text: 'I have much more to say to you, more than you can now bear. But when he, the Spirit of truth, comes, he will guide you into all the truth. He will not speak on his own; he will speak only what he hears, and he will tell you what is yet to come.',
        source: 'John 16:12-13',
        speaker: 'Jesus',
      },
      {
        text: 'And I will ask the Father, and he will give you another Advocate to help you and be with you forever.',
        source: 'John 14:16',
        speaker: 'Jesus',
      },
      {
        text: 'But very truly I tell you, it is for your good that I am going away. Unless I go away, the Advocate will not come to you; but if I go, I will send him to you.',
        source: 'John 16:7',
        speaker: 'Jesus',
      },
    ],
  },
  {
    id: 'muhammad',
    name: 'Muhammad',
    arabicName: 'محمد',
    era: 'Final Era',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700/50',
    revelation: 'The Quran',
    message: 'Worship God alone. I am the final messenger—believe in all who came before me.',
    mustBelieveIn: ['Adam', 'Noah', 'Abraham', 'Moses', 'Jesus'],
    additionalNote: 'The final revelation for all of humanity. Guarded from corruption because there will be no prophet after.',
    scriptures: [
      {
        text: 'Say, "He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."',
        source: 'Quran 112:1-4',
        speaker: 'God',
      },
      {
        text: 'We have not sent you, [O Muhammad], except as a mercy to the worlds.',
        source: 'Quran 21:107',
        speaker: 'God',
      },
      {
        text: 'Muhammad is not the father of any of your men, but he is the Messenger of Allah and the seal of the prophets.',
        source: 'Quran 33:40',
        speaker: 'God',
      },
    ],
  },
];

export const ProphetTimeline = ({ onComplete, onBack }: ProphetTimelineProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [selectedProphet, setSelectedProphet] = useState<string | null>(null);

  const scenes = ['intro', 'timeline', 'the-pattern', 'rejection', 'final'];

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  // Scene 0: Introduction
  if (scenes[currentScene] === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4"
      >
        {/* Back button */}
        {onBack && (
          <button
            onClick={handleBack}
            className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}

        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-indigo-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">
              One Message, Through Time
            </h1>
          </div>

          <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              God didn't send His guidance all at once. He revealed it in <span className="text-amber-400 font-semibold">stages</span>, through different messengers, to different people, at different times.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              But the <span className="text-white font-semibold">core message was always the same</span>:
            </p>

            <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-6">
              <p className="text-xl text-emerald-200 text-center font-medium">
                "Worship God alone, and follow the prophet as your human example—the prophet of your era."
              </p>
            </div>

            <p className="text-slate-400 text-center">
              Let's walk through history and see how this unfolded.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
            >
              See the Timeline
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Scene 1: Interactive Timeline
  if (scenes[currentScene] === 'timeline') {
    const selectedProphetData = prophets.find(p => p.id === selectedProphet);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 p-4 pt-6"
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-serif text-white mb-1">The Chain of Prophets</h2>
            <p className="text-slate-400 text-sm">Tap each era to learn more</p>
          </div>

          {/* Horizontal Timeline - scrollable on mobile */}
          <div className="relative mb-4">
            {/* Timeline container with horizontal scroll on mobile */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <div className="relative min-w-max px-2 sm:px-4">
                {/* Timeline line - aligned with dots (dots are h-5=20px, center at 10px, line h-1=4px, so top at 8px) */}
                <div className="absolute top-[8px] left-0 right-0 h-1 bg-gradient-to-r from-slate-700 via-emerald-700 to-purple-700 rounded-full" />

                {/* Prophet eras - horizontal layout, spaced evenly */}
                <div className="flex items-start justify-between gap-2 sm:gap-0 relative" style={{ minWidth: '700px' }}>
                  {prophets.map((prophet, index) => (
                    <motion.div
                      key={prophet.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      {/* Dot on timeline */}
                      <div className={`w-5 h-5 rounded-full border-2 z-10 flex-shrink-0 ${
                        selectedProphet === prophet.id
                          ? `${prophet.bgColor} ${prophet.borderColor}`
                          : 'bg-slate-800 border-slate-600'
                      }`} />

                      {/* Vertical connector line */}
                      <div className={`w-0.5 h-5 flex-shrink-0 ${
                        selectedProphet === prophet.id ? prophet.bgColor : 'bg-slate-600'
                      }`} />

                      {/* Era card - hanging below */}
                      <button
                        onClick={() => setSelectedProphet(selectedProphet === prophet.id ? null : prophet.id)}
                        className={`w-20 sm:w-28 p-2 sm:p-3 rounded-xl border-2 transition-all text-center ${
                          selectedProphet === prophet.id
                            ? `${prophet.bgColor} ${prophet.borderColor} scale-105`
                            : 'bg-slate-900/70 border-slate-700 hover:border-slate-500 hover:scale-105'
                        }`}
                      >
                        <span className={`text-xl sm:text-2xl font-arabic block ${prophet.color}`}>{prophet.arabicName}</span>
                        <span className="text-white text-xs sm:text-sm font-medium block truncate">{prophet.name}</span>
                        <span className={`text-[10px] sm:text-xs ${prophet.color} block truncate opacity-75`}>
                          {prophet.era}
                        </span>
                      </button>
                    </motion.div>
                  ))}

                  {/* End of time marker */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: prophets.length * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    {/* Dot on timeline */}
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-amber-400 z-10 flex-shrink-0" />

                    {/* Vertical connector line */}
                    <div className="w-0.5 h-5 bg-amber-700 flex-shrink-0" />

                    {/* Era card - hanging below */}
                    <div className="w-20 sm:w-28 p-2 sm:p-3 rounded-xl border-2 border-amber-500 bg-amber-900/30 text-center">
                      <span className="text-xl sm:text-2xl block">⏳</span>
                      <span className="text-amber-300 text-xs sm:text-sm font-medium block">Judgment</span>
                      <span className="text-[10px] sm:text-xs text-amber-400 block opacity-75">Day</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Scroll hint for mobile */}
            <div className="sm:hidden text-center text-slate-500 text-xs mt-1">
              ← Scroll to see all →
            </div>
          </div>

          {/* Selected prophet details - more compact */}
          <AnimatePresence>
            {selectedProphetData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${selectedProphetData.bgColor} rounded-xl p-4 sm:p-5 border ${selectedProphetData.borderColor} mb-4`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${selectedProphetData.bgColor} border ${selectedProphetData.borderColor} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-lg font-arabic ${selectedProphetData.color}`}>
                      {selectedProphetData.arabicName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg text-white font-semibold">{selectedProphetData.name}'s Era</h3>
                    {selectedProphetData.revelation && (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Book className="w-3 h-3" />
                        <span>{selectedProphetData.revelation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                  <p className="text-white text-sm italic">"{selectedProphetData.message}"</p>
                </div>

                {selectedProphetData.mustBelieveIn.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-300 text-xs mb-1">Must also believe in:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProphetData.mustBelieveIn.map(name => (
                        <span key={name} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 text-xs">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scripture quotes */}
                {selectedProphetData.scriptures && selectedProphetData.scriptures.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-300 text-xs mb-2 font-medium">From the Scripture:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedProphetData.scriptures.map((scripture, idx) => (
                        <div key={idx} className="bg-slate-900/70 rounded-lg p-3 border border-slate-700/50">
                          <p className="text-slate-200 text-sm italic leading-relaxed">
                            "{scripture.text}"
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-slate-500 text-xs">{scripture.source}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              scripture.speaker === 'God'
                                ? 'bg-amber-900/50 text-amber-300'
                                : scripture.speaker === 'Angel'
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-emerald-900/50 text-emerald-300'
                            }`}>
                              {scripture.speaker}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProphetData.additionalNote && (
                  <p className={`text-xs ${selectedProphetData.color} italic`}>
                    {selectedProphetData.additionalNote}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-4 text-center"
              >
                <p className="text-slate-400 text-sm">
                  Tap a prophet above to see their message and era
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue button */}
          <div className="text-center">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold transition flex items-center gap-2 mx-auto"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Scene 2: The Pattern - No scripture named them Jews/Christians
  if (scenes[currentScene] === 'the-pattern') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4"
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-2">
              The Straight Path
            </h2>
            <p className="text-blue-300">What were they actually called?</p>
          </div>

          <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 space-y-6">
            {/* Key insight */}
            <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-700/50">
              <p className="text-lg text-white leading-relaxed">
                No scripture ever named people <span className="text-blue-300">"Jews"</span> or <span className="text-blue-300">"Christians"</span>.
              </p>
              <p className="text-slate-300 mt-3">
                Search the Torah, the Psalms, the Gospel—you won't find God or any prophet telling people to call themselves by these names.
              </p>
            </div>

            {/* What they were called */}
            <div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Throughout history, true believers were simply people on <span className="text-emerald-400 font-semibold">"The Straight Path"</span>—those who submitted to God and followed His messenger of their time.
              </p>
              <p className="text-slate-300 leading-relaxed">
                There was no sect. No label. Just <span className="text-white font-medium">submission to the One God</span>.
              </p>
            </div>

            {/* The deviations */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium mb-3">When prophets passed away, people deviated in three ways:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">1.</span>
                  <p className="text-slate-300">They <span className="text-rose-300">rejected the next prophet</span> God sent</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">2.</span>
                  <p className="text-slate-300">They <span className="text-rose-300">elevated prophets to God</span> or divine status</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">3.</span>
                  <p className="text-slate-300">They <span className="text-rose-300">worshipped creation alongside God</span>—saints, angels, idols</p>
                </div>
              </div>
            </div>

            {/* Why new prophets came */}
            <p className="text-slate-300 leading-relaxed">
              This is why new prophets kept coming—to <span className="text-white font-medium">bring people back to the straight path</span> when they had strayed.
            </p>

            {/* The final revelation */}
            <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
              <p className="text-emerald-300 text-sm font-medium mb-2">The Final Revelation</p>
              <p className="text-white leading-relaxed mb-3">
                The Quran is the <span className="text-emerald-400 font-semibold">first and only scripture</span> to officially name this way of life:
              </p>
              <p className="text-2xl text-emerald-200 text-center font-arabic mb-2">
                إِسْلَام
              </p>
              <p className="text-center text-emerald-300 font-medium">
                Islam — "Submission to God"
              </p>
              <p className="text-slate-400 text-sm text-center mt-3 italic">
                "This day I have perfected your religion for you, completed My favor upon you, and have chosen for you Islam as your way of life." — Quran 5:3
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Scene 3: What happens when people reject
  if (scenes[currentScene] === 'rejection') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 flex items-center justify-center p-4"
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-4">
              What Happens When You Reject?
            </h2>
          </div>

          <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              You can't pick and choose. If you believe in one prophet but reject the next one God sent, <span className="text-rose-400 font-semibold">you've rejected God's message</span>.
            </p>

            {/* Example: Jews who rejected Jesus */}
            <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-700/50 mb-6">
              <p className="text-rose-300 text-sm font-medium mb-2">Historical Example:</p>
              <p className="text-slate-300 mb-3">
                Some of the Children of Israel were following Moses correctly. But when Jesus came with the same message, they rejected him.
              </p>
              <p className="text-white font-medium">
                By rejecting Jesus, they rejected their own religion—because Moses pointed to Jesus.
              </p>
            </div>

            {/* Example: Christians who rejected Muhammad */}
            <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-700/50 mb-6">
              <p className="text-rose-300 text-sm font-medium mb-2">The Same Pattern:</p>
              <p className="text-slate-300 mb-3">
                Those who accepted Jesus were the true believers of their time. But when Muhammad came with the final message...
              </p>
              <p className="text-white font-medium">
                Those who rejected him broke the chain—even though Jesus himself prophesied another to come.
              </p>
            </div>

            <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
              <p className="text-emerald-200 text-center text-lg">
                <span className="text-white font-semibold">"Make no distinction between the messengers."</span>
                <br />
                <span className="text-sm text-emerald-300">— Quran 2:285</span>
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
            >
              The Final Era
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Scene 3: The Final Era - Muhammad's time until Day of Judgment
  if (scenes[currentScene] === 'final') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4"
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">☪</span>
            </div>
            <h2 className="text-3xl font-serif text-white mb-2">
              The Final Era
            </h2>
            <p className="text-purple-400">We are living in this time now</p>
          </div>

          <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Muhammad ﷺ is the <span className="text-purple-400 font-semibold">final prophet</span>. There will be no messenger after him until the Day of Judgment.
            </p>

            <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-700/50 mb-6">
              <p className="text-purple-300 text-sm font-medium mb-3">Why is the Quran protected?</p>
              <p className="text-slate-300">
                Previous revelations were altered over time—that's why new prophets came. But the Quran is the <span className="text-white font-semibold">final revelation</span>, so God Himself guards it from corruption.
              </p>
              <p className="text-purple-200 italic mt-3 text-sm">
                "Indeed, it is We who sent down the message, and indeed, We will be its guardian." — Quran 15:9
              </p>
            </div>

            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-6">
              <p className="text-amber-300 text-sm font-medium mb-3">Why is it for everyone?</p>
              <p className="text-slate-300">
                Previous messages were for specific people at specific times. The Quran is for <span className="text-white font-semibold">all of humanity</span>, from Muhammad's time until the end.
              </p>
            </div>

            {/* The complete belief */}
            <div className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-700/50">
              <p className="text-emerald-300 text-sm font-medium mb-3">To be a Muslim today, you must believe:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white">There is no god but God (Allah)</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white">Muhammad is His final messenger</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white">All prophets before him were true messengers</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white">The Quran is the final, preserved revelation</p>
                </div>
              </div>
            </div>
          </div>

          {/* People of the Book note */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-600 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">People of the Book</span>
            </div>
            <p className="text-slate-300 text-sm">
              Muslims are permitted to eat food prepared by and marry from the "People of the Book" (Jews and Christians)—acknowledging our shared heritage through Abraham and the previous revelations.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ProphetTimeline;
