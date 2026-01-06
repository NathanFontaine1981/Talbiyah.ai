import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, MessageSquare, Users, Clock, Heart, AlertTriangle, Sparkles, Shield, Globe } from 'lucide-react';

interface TheVoiceProps {
  onComplete: () => void;
  onBack?: () => void;
}

const scenes = [
  {
    id: 'voice',
    title: 'The Voice',
    icon: <MessageSquare className="w-10 h-10" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          When you read the Quran, you instantly notice something strange. <span className="text-white font-semibold">It doesn't speak like a person.</span>
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          There are only two possibilities: either someone is <span className="text-rose-400">trying to impersonate God</span>, or <span className="text-emerald-400">it really is God</span>.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-amber-300 leading-relaxed">
            Given all the evidence we've examined—facts no human could have known in the 7th century—we've ruled out human authorship. And humans don't speak with such <span className="text-white font-semibold">assured knowledge</span>.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'declaration',
    title: 'The Declaration',
    icon: <BookOpen className="w-10 h-10" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The book wastes no time. In the very second chapter, it declares:
        </p>
        <div className="bg-slate-900/70 rounded-xl p-5 border border-amber-700/50 mb-4">
          <p className="text-2xl text-amber-300 font-arabic text-center mb-3" dir="rtl">
            ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ
          </p>
          <p className="text-white text-lg italic text-center">
            "This is the Book about which there is no doubt, a guidance for those conscious of Allah."
          </p>
          <p className="text-slate-500 text-sm text-center mt-2">— Surah Al-Baqarah, 2:2</p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          No hesitation. No hedging. <span className="text-white font-semibold">Absolute certainty.</span> What human would stake their reputation on such a bold claim?
        </p>
      </>
    ),
  },
  {
    id: 'the-names',
    title: 'The Names',
    icon: <Globe className="w-10 h-10" />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The name <span className="text-amber-400 font-semibold">"Allah"</span> might sound foreign to you. But consider this:
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Jesus spoke <span className="text-white font-semibold">Aramaic</span>. What name did he use for God?
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-purple-300 text-xl text-center font-semibold mb-2">Alaha / Elah</p>
          <p className="text-slate-400 text-sm text-center">The Aramaic word for God—almost identical to "Allah"</p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          But wait—the Aramaic language <span className="text-white font-semibold">doesn't have the letter J</span>. So what was Jesus' actual name in his own language?
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-purple-300 text-xl text-center font-semibold mb-2">Yeshua / Isa</p>
          <p className="text-slate-400 text-sm text-center">The same name used in the Quran: عيسى (Isa)</p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Jesus was born in <span className="text-white font-semibold">Jerusalem—the Middle East</span>. Most of the prophet names you know have been <span className="text-amber-400">Latinised</span>. That's why the original names feel foreign.
        </p>
      </>
    ),
  },
  {
    id: 'the-promise',
    title: 'The Promise',
    icon: <Shield className="w-10 h-10" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          But here's something even more remarkable. The Quran doesn't just claim to be from God—it promises that <span className="text-emerald-400 font-semibold">it will never be corrupted</span>:
        </p>
        <div className="bg-slate-900/70 rounded-xl p-5 border border-emerald-700/50 mb-4">
          <p className="text-2xl text-emerald-300 font-arabic text-center mb-3" dir="rtl">
            إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
          </p>
          <p className="text-white text-lg italic text-center">
            "Indeed, it is We who sent down the Reminder, and indeed, We will be its Guardian."
          </p>
          <p className="text-slate-500 text-sm text-center mt-2">— Surah Al-Hijr, 15:9</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-300 leading-relaxed mb-3">
            Think about this: <span className="text-white font-semibold">no other religious scripture makes this claim</span>. And for good reason—it would be too easy to disprove.
          </p>
          <p className="text-amber-300 leading-relaxed">
            If even one word had been changed over 1,400 years, this claim would be shattered. Only someone who <span className="text-white font-semibold">knows the future with certainty</span> could make such a bold promise.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'revelation',
    title: 'The Revelation',
    icon: <Clock className="w-10 h-10" />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          This book was revealed over <span className="text-purple-400 font-semibold">23 years</span>—not in order, but as situations arose.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Yet when compiled, it flows perfectly. No contradictions. No revisions. No "I was wrong earlier."
        </p>
        <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50 mb-4">
          <p className="text-purple-200 leading-relaxed">
            The Arabs of that era were <span className="text-white font-semibold">masters of language</span>. They prided themselves on their poetry, their ability to rhyme, their powerful memorisation. This was their boast.
          </p>
          <p className="text-purple-200 leading-relaxed mt-3">
            Yet the Quran silenced them. They could not produce anything like it. <span className="text-white font-semibold">The challenge still stands today.</span>
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-300 leading-relaxed mb-3">
            It has a <span className="text-amber-400 font-semibold">rhythmic flow</span>, soothing to the ears—yet it explains <span className="text-white font-semibold">everything</span> about life, death, law, history, and the unseen.
          </p>
          <p className="text-slate-300 leading-relaxed">
            No filler. No padding to keep the rhythm going. <span className="text-white font-semibold">Straight to the point.</span> How is this possible?
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'contents',
    title: 'The Contents',
    icon: <Sparkles className="w-10 h-10" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          This book tells us <span className="text-white font-semibold">why we were created</span>:
        </p>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-emerald-700/50 mb-4">
          <p className="text-xl text-emerald-300 font-arabic text-center mb-2" dir="rtl">
            وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
          </p>
          <p className="text-white italic text-center">
            "And I did not create the jinn and mankind except to worship Me."
          </p>
          <p className="text-slate-500 text-sm text-center mt-1">— Surah Adh-Dhariyat, 51:56</p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          It describes the future <span className="text-white font-semibold">as if it already happened</span>:
        </p>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-blue-700/50 mb-4">
          <p className="text-xl text-blue-300 font-arabic text-center mb-2" dir="rtl">
            وَنُفِخَ فِي الصُّورِ فَصَعِقَ مَن فِي السَّمَاوَاتِ وَمَن فِي الْأَرْضِ
          </p>
          <p className="text-white italic text-center">
            "And the Horn will be blown, and whoever is in the heavens and whoever is on the earth will fall dead."
          </p>
          <p className="text-slate-500 text-sm text-center mt-1">— Surah Az-Zumar, 39:68</p>
        </div>
        <p className="text-slate-400 text-sm italic">
          Past tense. As if narrating history—yet describing events that haven't occurred.
        </p>
      </>
    ),
  },
  {
    id: 'the-meaning',
    title: 'The Meaning',
    icon: <Sparkles className="w-10 h-10" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Wait—so we're here on earth just to <span className="text-white font-semibold">bow down and say "God is great" all day?</span>
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Not quite. The word <span className="text-amber-400 font-semibold">"Islam"</span> means <span className="text-white font-semibold">submission</span>. It's a verb—an action.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-300 leading-relaxed mb-3">
            Look around you. <span className="text-white font-semibold">Everything in creation "does Islam"</span>—the planets orbit, the sun rises and sets, the grass grows, the trees sway. They all obey the command of Allah.
          </p>
          <p className="text-amber-300 leading-relaxed">
            Something that does Islam is called a <span className="text-white font-semibold">Muslim</span>.
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          We are told only <span className="text-white font-semibold">two creations</span> have been given the choice to obey or not: humans and the jinn (a creation we cannot see).
        </p>
        <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
          <p className="text-blue-200 leading-relaxed mb-2">
            The <span className="text-white font-semibold">angels</span> also submit to Allah's command—therefore they too are Muslim. But unlike us, they have <span className="text-white font-semibold">no choice</span>. They obey willingly and completely.
          </p>
          <p className="text-slate-400 text-sm italic">
            Another creation we cannot verify today—but given everything we've seen, what reason do we have to doubt?
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'the-body',
    title: 'The Body',
    icon: <Heart className="w-10 h-10" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Here's something remarkable: <span className="text-white font-semibold">your body is already Muslim</span>.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-300 leading-relaxed">
            Your heart pumps. Your eyes blink. Your cells repair themselves. Your hair grows. <span className="text-emerald-400 font-semibold">Every part of your body is in total submission</span>—doing exactly what Allah commanded it to do.
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          It's only your <span className="text-amber-400 font-semibold">soul</span>—placed inside this body—that has been given a choice.
        </p>
        <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
          <p className="text-amber-200 leading-relaxed">
            And we are told: we will be <span className="text-white font-semibold">judged on how we used that body</span>. Our soul can either submit and get in line with the rest of creation... or follow its own desires.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'the-offer',
    title: 'The Offer',
    icon: <Sparkles className="w-10 h-10" />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Allah says: <span className="text-white font-semibold">I will give you what you want.</span>
        </p>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-purple-700/50 mb-4">
          <p className="text-lg text-purple-300 font-arabic text-center mb-2" dir="rtl">
            مَن كَانَ يُرِيدُ حَرْثَ الْآخِرَةِ نَزِدْ لَهُ فِي حَرْثِهِ وَمَن كَانَ يُرِيدُ حَرْثَ الدُّنْيَا نُؤْتِهِ مِنْهَا
          </p>
          <p className="text-white italic text-center text-sm">
            "Whoever desires the harvest of the Hereafter—We increase for him his harvest. And whoever desires the harvest of this world—We give him thereof."
          </p>
          <p className="text-slate-500 text-sm text-center mt-1">— Surah Ash-Shura, 42:20</p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          You can have <span className="text-rose-400">this life only</span>... or <span className="text-emerald-400">this life AND the next</span>. And the next life is <span className="text-white font-semibold">much, much longer lasting</span>.
        </p>
      </>
    ),
  },
  {
    id: 'the-manual',
    title: 'The Manual',
    icon: <BookOpen className="w-10 h-10" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          When I understood this, everything clicked. <span className="text-white font-semibold">Daily activities become worship</span> if done the way Allah intended:
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-emerald-300 text-sm">Eating with right hand</p>
            <p className="text-slate-500 text-xs">= worship</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-emerald-300 text-sm">Smiling at someone</p>
            <p className="text-slate-500 text-xs">= worship</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-emerald-300 text-sm">Relieving yourself properly</p>
            <p className="text-slate-500 text-xs">= worship</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-emerald-300 text-sm">Being kind to parents</p>
            <p className="text-slate-500 text-xs">= worship</p>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You mean <span className="text-white font-semibold">nothing has been left out?</span> Really—even how to go to the toilet?
        </p>
        <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
          <p className="text-blue-200 leading-relaxed">
            This book is literally <span className="text-white font-semibold">the manual for human beings</span>—just like a car comes with a manual. That's why the tradition of memorising the Quran is a lifelong process. Those who complete it have <span className="text-amber-300">internalised everything needed to get through life</span>.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'the-mercy',
    title: 'The Mercy',
    icon: <Heart className="w-10 h-10" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          But what if I'm weak? What if I <span className="text-white font-semibold">can't follow all the rules?</span>
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          That's okay. <span className="text-emerald-400 font-semibold">Allah knows this.</span> He created you—He knows you were created weak.
        </p>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-emerald-700/50 mb-4">
          <p className="text-lg text-emerald-300 font-arabic text-center mb-2" dir="rtl">
            كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ
          </p>
          <p className="text-white italic text-center text-sm">
            "Every son of Adam sins, and the best of sinners are those who repent."
          </p>
          <p className="text-slate-500 text-sm text-center mt-1">— Hadith (Tirmidhi)</p>
        </div>
        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
          <p className="text-emerald-200 leading-relaxed mb-3">
            The <span className="text-white font-semibold">best of you</span> are not those who never make mistakes. They are the <span className="text-white font-semibold">repentant sinners</span>—those who fall, ask forgiveness, and strive to correct themselves.
          </p>
          <p className="text-emerald-200 leading-relaxed">
            You will always find Allah <span className="text-white font-semibold">Forgiving and Merciful</span>—if you have the correct intention.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'three-groups',
    title: 'The Three Groups',
    icon: <Users className="w-10 h-10" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The Author divides humanity into three groups:
        </p>
        <div className="space-y-4 mb-4">
          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-300 font-semibold mb-1">1. The Believers</p>
            <p className="text-slate-300 text-sm">Those who accept the truth and submit to their Creator</p>
          </div>
          <div className="bg-rose-900/30 rounded-xl p-4 border border-rose-700/50">
            <p className="text-rose-300 font-semibold mb-1">2. The Disbelievers</p>
            <p className="text-slate-300 text-sm">"Kafir" literally means "one who covers"—those who cover the truth</p>
          </div>
          <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
            <p className="text-amber-300 font-semibold mb-1">3. The Hypocrites</p>
            <p className="text-slate-300 text-sm">Those who say they believe but inwardly they do not</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm italic">
          The book exposes what's in hearts—something only the Creator would know.
        </p>
      </>
    ),
  },
  {
    id: 'the-reality',
    title: 'The Reality',
    icon: <AlertTriangle className="w-10 h-10" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Ask yourself: <span className="text-white font-semibold">What reason do I now have to not be convinced that all this is the truth?</span>
        </p>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-4">
          <p className="text-slate-300 leading-relaxed mb-3">
            Consider this:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li>• You never asked to be here—but you are here</li>
            <li>• You are not in control of your organs, your eyes, your sleeping</li>
            <li>• One thing you know for certain: <span className="text-rose-400 font-semibold">you will taste death one day</span></li>
          </ul>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          This book is telling you what you need to do to <span className="text-white font-semibold">prepare for when that day comes</span>.
        </p>
      </>
    ),
  },
  {
    id: 'the-choice',
    title: 'The Choice',
    icon: <Heart className="w-10 h-10" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The book describes two destinations—and two types of people:
        </p>
        <div className="space-y-4 mb-4">
          <div className="bg-rose-900/30 rounded-xl p-4 border border-rose-700/50">
            <p className="text-lg text-rose-300 font-arabic text-center mb-2" dir="rtl">
              فَأَمَّا مَن طَغَىٰ وَآثَرَ الْحَيَاةَ الدُّنْيَا فَإِنَّ الْجَحِيمَ هِيَ الْمَأْوَىٰ
            </p>
            <p className="text-white italic text-center text-sm">
              "As for he who transgressed and preferred the life of this world, then indeed, Hellfire will be his refuge."
            </p>
          </div>
          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-lg text-emerald-300 font-arabic text-center mb-2" dir="rtl">
              وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ فَإِنَّ الْجَنَّةَ هِيَ الْمَأْوَىٰ
            </p>
            <p className="text-white italic text-center text-sm">
              "But as for he who feared standing before his Lord and restrained himself from his desires, then indeed, Paradise will be his refuge."
            </p>
          </div>
        </div>
        <p className="text-slate-500 text-sm text-center mb-4">— Surah An-Naziat, 79:37-41</p>

        {/* The real choice */}
        <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50 mb-4">
          <p className="text-slate-300 leading-relaxed mb-3">
            If you choose not to become Muslim, you can continue your life following <span className="text-rose-300">your own desires</span>.
          </p>
          <p className="text-slate-300 leading-relaxed mb-3">
            But if you choose to become Muslim, it means you are choosing to give up your own will for <span className="text-emerald-300">the will of the Creator</span>.
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
            <p className="text-purple-200 text-sm italic text-center">
              Sound familiar? It's exactly what Jesus taught:
            </p>
            <p className="text-white text-center font-medium mt-2">
              "Thy will be done, on earth as it is in heaven."
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Matthew 6:10</p>
          </div>
        </div>

        {/* The regret of those who denied */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-300 leading-relaxed mb-3">
            And what do those who denied say when they arrive?
          </p>
          <div className="bg-rose-900/30 rounded-lg p-4 border border-rose-700/50 mb-3">
            <p className="text-rose-300 font-arabic text-center mb-2" dir="rtl">
              كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ ۝ قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ
            </p>
            <p className="text-white italic text-center text-sm mb-2">
              "Every time a group is thrown into it, its keepers ask them, 'Did there not come to you a warner?' They will say, 'Yes, a warner had come to us, but we denied and said: Allah has not sent down anything.'"
            </p>
            <p className="text-slate-500 text-xs text-center">— Surah Al-Mulk, 67:8-9</p>
          </div>
          <p className="text-amber-300 leading-relaxed text-center font-medium">
            "If only we had been listening or reasoning, we would not be among the companions of the Blaze."
          </p>
          <p className="text-slate-500 text-xs text-center mt-1">— 67:10</p>
        </div>

        {/* Paradise description */}
        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50 mb-4">
          <p className="text-slate-300 leading-relaxed mb-3">
            And what awaits those who believed?
          </p>
          <p className="text-emerald-300 font-arabic text-center mb-2" dir="rtl">
            يُطَافُ عَلَيْهِم بِصِحَافٍ مِّن ذَهَبٍ وَأَكْوَابٍ ۖ وَفِيهَا مَا تَشْتَهِيهِ الْأَنفُسُ وَتَلَذُّ الْأَعْيُنُ ۖ وَأَنتُمْ فِيهَا خَالِدُونَ
          </p>
          <p className="text-white italic text-center text-sm mb-2">
            "Circulated among them will be plates and vessels of gold. And therein is whatever the souls desire and what delights the eyes—and you will abide therein eternally."
          </p>
          <p className="text-slate-500 text-xs text-center">— Surah Az-Zukhruf, 43:71</p>
        </div>

        <div className="bg-slate-900/70 rounded-xl p-5 border border-amber-700/50 mb-4">
          <p className="text-amber-200 leading-relaxed mb-3">
            Here's the thing: <span className="text-white font-semibold">it doesn't matter what we think</span>. If the evidence is true, it's going to happen regardless of what we believe.
          </p>
          <p className="text-amber-200 leading-relaxed">
            So it makes sense to obey the only One worthy of our obedience—the One who brought us into being, who sustains us <span className="text-white">every second of every day</span>.
          </p>
        </div>
        <p className="text-slate-400 text-sm italic text-center">
          The choice is yours. But now you cannot say you were never told.
        </p>
      </>
    ),
  },
];

export const TheVoice = ({ onComplete, onBack }: TheVoiceProps) => {
  const [currentScene, setCurrentScene] = useState(0);

  const scene = scenes[currentScene];
  const isLastScene = currentScene === scenes.length - 1;
  const isFirstScene = currentScene === 0;

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstScene && onBack) {
      onBack();
    } else {
      setCurrentScene(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex flex-col"
    >
      {/* Progress dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentScene(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentScene
                ? 'bg-amber-500 w-6'
                : i < currentScene
                ? 'bg-amber-500/50'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-16">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Scene Icon */}
              <div className={`w-24 h-24 ${scene.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <div className={scene.iconColor}>
                  {scene.icon}
                </div>
              </div>

              {/* Scene Title */}
              <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
                {scene.title}
              </h1>
              <p className="text-slate-500 text-sm mb-8">
                {currentScene + 1} of {scenes.length}
              </p>

              {/* Scene Content */}
              <div className="bg-slate-900/70 rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8 text-left">
                {scene.content}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                {(currentScene > 0 || onBack) && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full transition flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {isLastScene ? 'Continue' : 'Next'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default TheVoice;
