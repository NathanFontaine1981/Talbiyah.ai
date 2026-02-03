/**
 * Janazah Prayer Practice Page
 * Learn and practice Salatul Janazah - the funeral prayer
 * Features: Step-by-step instructions, Arabic text, transliteration, translation, PDF download
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Heart,
  Users,
  Baby,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// The four takbeers and what to recite after each
const JANAZAH_SECTIONS = [
  {
    id: 1,
    takbeer: 'التكبيرة الأولى',
    takbeerEnglish: 'First Takbeer',
    instruction: 'Raise hands and say "Allahu Akbar", then recite Surah Al-Fatiha',
    content: {
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
      transliteration: 'Bismillāhir-Raḥmānir-Raḥīm\nAl-ḥamdu lillāhi Rabbil-ʿālamīn\nAr-Raḥmānir-Raḥīm\nMāliki Yawmid-Dīn\nIyyāka naʿbudu wa iyyāka nastaʿīn\nIhdinaṣ-Ṣirāṭal-Mustaqīm\nṢirāṭalladhīna anʿamta ʿalayhim ghayril-maghḍūbi ʿalayhim wa laḍ-ḍāllīn',
      english: 'In the name of Allah, the Most Gracious, the Most Merciful\nAll praise is due to Allah, Lord of the worlds\nThe Most Gracious, the Most Merciful\nMaster of the Day of Judgment\nYou alone we worship, and You alone we ask for help\nGuide us to the straight path\nThe path of those You have blessed, not those who earned Your anger, nor those who went astray',
      name: 'Surah Al-Fatiha'
    }
  },
  {
    id: 2,
    takbeer: 'التكبيرة الثانية',
    takbeerEnglish: 'Second Takbeer',
    instruction: 'Say "Allahu Akbar" (without raising hands), then recite Salawat upon the Prophet',
    content: {
      arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ\nكَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ\nإِنَّكَ حَمِيدٌ مَجِيدٌ\nاللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ\nكَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ\nإِنَّكَ حَمِيدٌ مَجِيدٌ',
      transliteration: 'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad\nkamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm\ninnaka Ḥamīdun Majīd\nAllāhumma bārik ʿalā Muḥammadin wa ʿalā āli Muḥammad\nkamā bārakta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm\ninnaka Ḥamīdun Majīd',
      english: 'O Allah, send prayers upon Muhammad and upon the family of Muhammad\nas You sent prayers upon Ibrahim and upon the family of Ibrahim\nIndeed, You are Praiseworthy and Glorious\nO Allah, bless Muhammad and the family of Muhammad\nas You blessed Ibrahim and the family of Ibrahim\nIndeed, You are Praiseworthy and Glorious',
      name: 'Durood Ibrahim'
    }
  },
  {
    id: 3,
    takbeer: 'التكبيرة الثالثة',
    takbeerEnglish: 'Third Takbeer',
    instruction: 'Say "Allahu Akbar", then make dua for the deceased',
    content: {
      arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ\nوَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ\nوَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ\nوَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ\nوَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ\nوَأَهْلًا خَيْرًا مِنْ أَهْلِهِ\nوَزَوْجًا خَيْرًا مِنْ زَوْجِهِ\nوَأَدْخِلْهُ الْجَنَّةَ\nوَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَعَذَابِ النَّارِ',
      transliteration: 'Allāhummagh-fir lahu warḥamhu wa ʿāfihi waʿfu ʿanh\nwa akrim nuzulahu wa wassiʿ mudkhalah\nwagh-silhu bil-māʾi wath-thalji wal-barad\nwa naqqihi minal-khaṭāyā kamā naqqaytat-thawbal-abyaḍa minad-danas\nwa abdilhu dāran khayran min dārih\nwa ahlan khayran min ahlih\nwa zawjan khayran min zawjih\nwa adkhilhul-Jannah\nwa aʿidhhu min ʿadhābil-qabri wa ʿadhābin-nār',
      english: 'O Allah, forgive him and have mercy on him, keep him safe and pardon him\nHonor his resting place and expand his entry\nWash him with water, snow, and hail\nCleanse him from sins as a white garment is cleansed from dirt\nGive him a home better than his home\nA family better than his family\nA spouse better than his spouse\nAdmit him to Paradise\nAnd protect him from the punishment of the grave and the punishment of the Fire',
      name: 'Dua for the Deceased',
      note: 'For female: change "lahu" to "lahā", "ʿanh" to "ʿanhā", etc.'
    }
  },
  {
    id: 4,
    takbeer: 'التكبيرة الرابعة',
    takbeerEnglish: 'Fourth Takbeer',
    instruction: 'Say "Allahu Akbar", then make a short dua and end with Salam',
    content: {
      arabic: 'اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ\nوَلَا تَفْتِنَّا بَعْدَهُ\nوَاغْفِرْ لَنَا وَلَهُ',
      transliteration: 'Allāhumma lā taḥrimnā ajrah\nwa lā taftinnā baʿdah\nwagh-fir lanā wa lah',
      english: 'O Allah, do not deprive us of his reward\nAnd do not put us to trial after him\nAnd forgive us and him',
      name: 'Final Dua',
      note: 'Then turn your head to the right and say: "As-salāmu ʿalaykum wa raḥmatullāh" (once or twice)'
    }
  }
];

// Dua for deceased child
const CHILD_DUA = {
  arabic: 'اللَّهُمَّ اجْعَلْهُ فَرَطًا وَذُخْرًا لِوَالِدَيْهِ\nوَشَفِيعًا مُجَابًا\nاللَّهُمَّ ثَقِّلْ بِهِ مَوَازِينَهُمَا\nوَأَعْظِمْ بِهِ أُجُورَهُمَا\nوَأَلْحِقْهُ بِصَالِحِ الْمُؤْمِنِينَ\nوَاجْعَلْهُ فِي كَفَالَةِ إِبْرَاهِيمَ\nوَقِهِ بِرَحْمَتِكَ عَذَابَ الْجَحِيمِ',
  transliteration: 'Allāhummajʿalhu faraṭan wa dhukhran liwālidayh\nwa shafīʿan mujābā\nAllāhumma thaqqil bihi mawāzīnahumā\nwa aʿẓim bihi ujūrahumā\nwa alḥiqhu biṣāliḥil-muʾminīn\nwajʿalhu fī kafālati Ibrāhīm\nwa qihi biraḥmatika ʿadhābal-jaḥīm',
  english: 'O Allah, make him a preceding reward and treasure for his parents\nAnd an intercessor whose intercession is accepted\nO Allah, make heavy their scales through him\nAnd magnify their rewards through him\nJoin him with the righteous believers\nPlace him in the care of Ibrahim\nAnd protect him by Your mercy from the punishment of Hellfire'
};

// Key points about Janazah prayer
const KEY_POINTS = [
  'The Janazah prayer is performed standing throughout - there is no bowing (ruku) or prostration (sujud)',
  'It is a collective obligation (Fard Kifayah) - if some Muslims perform it, the obligation is lifted from others',
  'The Imam stands at the head of a male deceased and at the middle of a female deceased',
  'Hands are raised only during the first takbeer',
  'The prayer should be performed with sincerity and focus on supplicating for the deceased'
];

export default function JanazahPractice() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  const [showChildDua, setShowChildDua] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const markSectionComplete = (id: number) => {
    const newCompleted = new Set(completedSections);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedSections(newCompleted);
  };

  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Salatul Janazah', pageWidth / 2, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('The Funeral Prayer', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Instructions
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      const instructions = 'The Janazah prayer consists of four takbeers with specific supplications after each. There is no ruku or sujud.';
      const splitInstructions = pdf.splitTextToSize(instructions, pageWidth - margin * 2);
      pdf.text(splitInstructions, margin, y);
      y += splitInstructions.length * 5 + 10;

      // Each section
      JANAZAH_SECTIONS.forEach((section, index) => {
        // Check if we need a new page
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }

        // Section header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${section.takbeerEnglish}`, margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(section.instruction, margin, y);
        y += 7;

        // Content name
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.content.name, margin, y);
        y += 7;

        // Transliteration
        pdf.setFont('helvetica', 'normal');
        const translitLines = pdf.splitTextToSize(section.content.transliteration.replace(/\n/g, ' '), pageWidth - margin * 2);
        pdf.text(translitLines, margin, y);
        y += translitLines.length * 5 + 3;

        // English
        pdf.setFont('helvetica', 'italic');
        const englishLines = pdf.splitTextToSize(section.content.english.replace(/\n/g, ' '), pageWidth - margin * 2);
        pdf.text(englishLines, margin, y);
        y += englishLines.length * 5 + 10;

        // Note if exists
        if (section.content.note) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          const noteLines = pdf.splitTextToSize(`Note: ${section.content.note}`, pageWidth - margin * 2);
          pdf.text(noteLines, margin, y);
          y += noteLines.length * 4 + 5;
        }

        y += 5;
      });

      // Add child dua section
      if (y > 200) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('For Deceased Child (instead of main dua after 3rd takbeer):', margin, y);
      y += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const childTranslit = pdf.splitTextToSize(CHILD_DUA.transliteration.replace(/\n/g, ' '), pageWidth - margin * 2);
      pdf.text(childTranslit, margin, y);
      y += childTranslit.length * 5 + 3;

      pdf.setFont('helvetica', 'italic');
      const childEnglish = pdf.splitTextToSize(CHILD_DUA.english.replace(/\n/g, ' '), pageWidth - margin * 2);
      pdf.text(childEnglish, margin, y);

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by Talbiyah.ai - Your Path to Islamic Knowledge', pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

      pdf.save('janazah-prayer-guide.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dua-builder')}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Dua Builder</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-600/50 rounded-xl flex items-center justify-center">
              <Users className="text-slate-300" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Salatul Janazah</h1>
              <p className="text-slate-300">The Funeral Prayer</p>
            </div>
          </div>

          {/* Download button */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {generatingPdf ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Key Points */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BookOpen className="text-amber-400" size={20} />
            Key Points
          </h2>
          <ul className="space-y-2">
            {KEY_POINTS.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Progress: {completedSections.size} of 4 sections</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full transition-colors ${
                  completedSections.has(i) ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* The Four Takbeers */}
        <div className="space-y-4">
          {JANAZAH_SECTIONS.map((section) => {
            const isExpanded = expandedSection === section.id;
            const isComplete = completedSections.has(section.id);

            return (
              <div
                key={section.id}
                className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-colors ${
                  isComplete ? 'border-emerald-500/50' : 'border-slate-700'
                }`}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isComplete ? 'bg-emerald-500/20' : 'bg-slate-700'
                    }`}>
                      {isComplete ? (
                        <Check className="text-emerald-400" size={20} />
                      ) : (
                        <span className="text-white font-bold">{section.id}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{section.takbeerEnglish}</p>
                      <p className="text-sm text-slate-400">{section.content.name}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="text-slate-400" size={20} />
                  ) : (
                    <ChevronDown className="text-slate-400" size={20} />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700">
                    {/* Instruction */}
                    <div className="py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 mt-4">
                      <p className="text-amber-200 text-sm">{section.instruction}</p>
                    </div>

                    {/* Arabic */}
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xl text-white font-arabic text-right leading-loose" dir="rtl">
                        {section.content.arabic}
                      </p>
                    </div>

                    {/* Transliteration */}
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transliteration</p>
                      <p className="text-slate-300 whitespace-pre-line">{section.content.transliteration}</p>
                    </div>

                    {/* English */}
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Translation</p>
                      <p className="text-slate-400 italic whitespace-pre-line">{section.content.english}</p>
                    </div>

                    {/* Note */}
                    {section.content.note && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-200 text-sm">{section.content.note}</p>
                      </div>
                    )}

                    {/* Mark Complete Button */}
                    <button
                      onClick={() => markSectionComplete(section.id)}
                      className={`mt-4 w-full py-2 rounded-lg font-medium transition-colors ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {isComplete ? 'Completed' : 'Mark as Learned'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Child Dua Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowChildDua(!showChildDua)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Baby className="text-pink-400" size={20} />
              </div>
              <div>
                <p className="font-semibold text-white">Dua for Deceased Child</p>
                <p className="text-sm text-slate-400">Alternative dua after 3rd takbeer</p>
              </div>
            </div>
            {showChildDua ? (
              <ChevronUp className="text-slate-400" size={20} />
            ) : (
              <ChevronDown className="text-slate-400" size={20} />
            )}
          </button>

          {showChildDua && (
            <div className="px-4 pb-4 border-t border-slate-700">
              <div className="py-3 bg-pink-500/10 border border-pink-500/20 rounded-lg px-4 mt-4">
                <p className="text-pink-200 text-sm">
                  When praying Janazah for a child who has not reached puberty, this dua is recited instead of the main dua after the third takbeer.
                </p>
              </div>

              {/* Arabic */}
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-xl text-white font-arabic text-right leading-loose" dir="rtl">
                  {CHILD_DUA.arabic}
                </p>
              </div>

              {/* Transliteration */}
              <div className="mt-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transliteration</p>
                <p className="text-slate-300 whitespace-pre-line">{CHILD_DUA.transliteration}</p>
              </div>

              {/* English */}
              <div className="mt-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Translation</p>
                <p className="text-slate-400 italic whitespace-pre-line">{CHILD_DUA.english}</p>
              </div>
            </div>
          )}
        </div>

        {/* Gender Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
            <User size={18} />
            Gender Adjustments
          </h3>
          <p className="text-blue-100/80 text-sm">
            When praying for a female, change the masculine pronouns to feminine:
          </p>
          <ul className="mt-2 text-sm text-blue-100/70 space-y-1">
            <li>• "lahu" (له) becomes "lahā" (لها)</li>
            <li>• "ʿanhu" (عنه) becomes "ʿanhā" (عنها)</li>
            <li>• "warḥamhu" becomes "warḥamhā"</li>
            <li>• "nuzulahu" becomes "nuzulahā"</li>
          </ul>
        </div>

        {/* Completion Message */}
        {completedSections.size === 4 && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-emerald-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">May Allah reward you</h3>
            <p className="text-slate-300">
              You have learned the complete Janazah prayer. May Allah accept your efforts and make you a means of mercy for the deceased.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
