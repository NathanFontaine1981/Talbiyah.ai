import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Download,
  Copy,
  Check,
  Clock,
  Users,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  Pause,
  Play,
  StopCircle,
  Save,
  FolderOpen,
  Trash2,
  X,
  Coins,
  Gift
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { generateKhutbaHTML } from '../utils/generateKhutbaHTML';

// Token costs
const KHUTBAH_TEXT_TOKEN_COST = 20; // After 2 free per month
const KHUTBAH_AUDIO_TOKEN_COST = 25;
const FREE_KHUTBAHS_PER_MONTH = 2;

// Khutba Structure Types
interface KhutbaSection {
  type: 'arabic' | 'text' | 'verse' | 'hadith';
  arabic?: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  explanation?: string;
}

interface KhutbaContent {
  title: string;
  duration: 'short' | 'medium' | 'long';
  audience: string;
  first_khutbah: {
    opening: KhutbaSection[];
    main_content: {
      introduction: string;
      quran_evidence: KhutbaSection[];
      hadith_evidence: KhutbaSection[];
      practical_application: string[];
      call_to_action: string;
    };
    closing: KhutbaSection;
  };
  second_khutbah: {
    opening: KhutbaSection;
    reminder: string;
    dua: KhutbaSection[];
    salawat: KhutbaSection;
  };
  sources: string[];
}

// Topic categories
const TOPIC_CATEGORIES = {
  seasonal: {
    label: 'Seasonal & Calendar',
    topics: [
      'Preparing for Ramadan',
      'Lessons from Hajj',
      'The Blessed Month of Muharram',
      'Welcoming the Month of Rajab',
      'The Night of Isra and Miraj',
      'Significance of Shaban'
    ]
  },
  youth: {
    label: 'Youth & Students',
    topics: [
      'Dealing with Peer Pressure',
      'Social Media and Islam',
      'Balancing Deen and Dunya',
      'Respect for Parents and Teachers',
      'Finding Purpose as a Young Muslim',
      'Avoiding Haram Relationships'
    ]
  },
  fundamental: {
    label: 'Fundamental Topics',
    topics: [
      'The Importance of Salah',
      'Understanding Tawheed',
      'The Dangers of Shirk',
      'Character of the Prophet ﷺ',
      'The Five Pillars of Islam',
      'Seeking Knowledge in Islam'
    ]
  },
  family: {
    label: 'Family & Community',
    topics: [
      'Raising Righteous Children',
      'Rights of Spouses in Islam',
      'Caring for Elderly Parents',
      'Brotherhood and Sisterhood',
      'Rights of Neighbors',
      'Unity of the Ummah'
    ]
  },
  character: {
    label: 'Character & Ethics',
    topics: [
      'The Virtue of Patience (Sabr)',
      'Gratitude and Thankfulness (Shukr)',
      'Truthfulness and Honesty',
      'Avoiding Backbiting (Gheebah)',
      'Controlling Anger',
      'Humility in Islam'
    ]
  },
  current: {
    label: 'Contemporary Issues',
    topics: [
      'Mental Health in Islam',
      'Environmental Responsibility',
      'Financial Ethics and Riba',
      'Justice and Oppression',
      'Supporting the Oppressed',
      'Islam in the Modern World'
    ]
  }
};

const DURATION_OPTIONS = [
  { value: 'short', label: 'Short (3-5 min)', description: 'For school Jummah, youth groups' },
  { value: 'medium', label: 'Medium (7-10 min)', description: 'Standard Friday khutbah' },
  { value: 'long', label: 'Long (12-15 min)', description: 'Detailed topic exploration' }
];

const AUDIENCE_OPTIONS = [
  { value: 'youth', label: 'Youth/Students', description: 'School-aged to young adults' },
  { value: 'general', label: 'General Community', description: 'Mixed audience of all ages' },
  { value: 'new_muslims', label: 'New Muslims', description: 'Reverts and those new to Islam' }
];

// Fixed Arabic text components for khutba structure - Complete Khutbatul Hajah
const KHUTBA_ARABIC = {
  opening_praise: {
    arabic: 'إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ، وَنَعُوذُ بِاللَّهِ مِنْ شُرُورِ أَنْفُسِنَا وَمِنْ سَيِّئَاتِ أَعْمَالِنَا، مَنْ يَهْدِهِ اللَّهُ فَلَا مُضِلَّ لَهُ، وَمَنْ يُضْلِلْ فَلَا هَادِيَ لَهُ',
    transliteration: 'Innal hamda lillahi nahmaduhu wa nasta\'eenahu wa nastaghfiruhu, wa na\'oodhu billahi min shuroori anfusina wa min sayyi\'aati a\'maalina. Man yahdihillahu fala mudilla lah, wa man yudlil fala haadiya lah.',
    translation: 'Indeed, all praise is due to Allah. We praise Him, seek His help and His forgiveness. We seek refuge in Allah from the evil of our souls and from our bad deeds. Whomever Allah guides, no one can misguide, and whomever Allah leads astray, no one can guide.'
  },
  testimony: {
    arabic: 'وَأَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Wa ashhadu an la ilaha illallahu wahdahu la shareeka lah, wa ashhadu anna Muhammadan \'abduhu wa rasooluhu.',
    translation: 'I bear witness that there is no deity worthy of worship except Allah alone, with no partner, and I bear witness that Muhammad is His slave and messenger.'
  },
  amma_badu: {
    arabic: 'أَمَّا بَعْدُ، فَإِنَّ أَصْدَقَ الْحَدِيثِ كِتَابُ اللَّهِ، وَخَيْرَ الْهُدَىٰ هُدَىٰ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَشَرَّ الْأُمُورِ مُحْدَثَاتُهَا، وَكُلَّ مُحْدَثَةٍ بِدْعَةٌ، وَكُلَّ بِدْعَةٍ ضَلَالَةٌ، وَكُلَّ ضَلَالَةٍ فِي النَّارِ',
    transliteration: 'Amma ba\'du, fa inna asdaqal hadeethi kitabullah, wa khayral hudaa hudaa Muhammadin sallallahu \'alayhi wa sallam, wa sharral umoori muhdathatuha, wa kulla muhdathatin bid\'ah, wa kulla bid\'atin dalalah, wa kulla dalalatin fin naar.',
    translation: 'To proceed: Indeed, the most truthful speech is the Book of Allah, and the best guidance is the guidance of Muhammad ﷺ. The worst of affairs are newly invented matters, every newly invented matter is an innovation, every innovation is misguidance, and every misguidance is in the Fire.'
  },
  opening_verse: {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
    transliteration: 'Ya ayyuhallatheena aamanuttaqullaha haqqa tuqaatihi wa la tamootunna illa wa antum muslimoon.',
    translation: 'O you who believe! Fear Allah as He should be feared, and die not except in a state of Islam.',
    reference: 'Aal-Imran 3:102'
  },
  first_khutbah_closing: {
    arabic: 'أقول قولي هذا وأستغفر الله لي ولكم ولسائر المسلمين من كل ذنب فاستغفروه إنه هو الغفور الرحيم',
    transliteration: 'Aqoolu qawli hadha wa astaghfirullaha li wa lakum wa lisa\'iril muslimeena min kulli dhanbin fastaghfiroohu innahu huwal ghafoorur raheem.',
    translation: 'I say these words and I seek forgiveness from Allah for myself, for you, and for all Muslims from every sin. So seek His forgiveness; indeed He is the Most Forgiving, Most Merciful.'
  },
  second_opening: {
    arabic: 'الحمد لله رب العالمين، والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين',
    transliteration: 'Alhamdulillahi rabbil \'aalameen, wassalatu wassalamu \'ala nabiyyina Muhammad wa \'ala aalihi wa sahbihi ajma\'een.',
    translation: 'All praise is due to Allah, Lord of the worlds, and may Allah\'s peace and blessings be upon our Prophet Muhammad, his family, and all his companions.'
  },
  dua_ummah: {
    arabic: 'اللهم أعز الإسلام والمسلمين، وأذل الشرك والمشركين، ودمر أعداء الدين',
    transliteration: 'Allahumma a\'izzal Islama wal Muslimeen, wa adhillash shirka wal mushrikeen, wa dammir a\'daa\'ad deen.',
    translation: 'O Allah, grant honor to Islam and the Muslims, and humiliate shirk and the mushrikeen, and destroy the enemies of the religion.'
  },
  dua_oppressed: {
    arabic: 'اللهم انصر إخواننا المستضعفين في كل مكان',
    transliteration: 'Allahumman-sur ikhwananal mustad\'afeena fi kulli makaan.',
    translation: 'O Allah, grant victory to our oppressed brothers and sisters everywhere.'
  },
  salawat: {
    arabic: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا',
    transliteration: 'Innallaha wa mala\'ikatahu yusalloona \'alan nabiyy. Ya ayyuhallatheena aamanu sallu \'alayhi wa sallimu tasleema.',
    translation: 'Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace.',
    reference: 'Al-Ahzab 33:56'
  }
};

export default function KhutbaCreator() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [audience, setAudience] = useState('general');
  const [loading, setLoading] = useState(false);
  const [khutba, setKhutba] = useState<KhutbaContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    first_opening: true,
    first_content: true,
    first_closing: true,
    second_khutbah: true
  });
  const khutbaRef = useRef<HTMLDivElement>(null);

  // Audio state
  const [isAdmin, setIsAdmin] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedKhutbahId, setSavedKhutbahId] = useState<string | null>(null);

  // Saved khutbahs list
  const [showSavedKhutbahs, setShowSavedKhutbahs] = useState(false);
  const [savedKhutbahs, setSavedKhutbahs] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Token and usage state
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [monthlyUsage, setMonthlyUsage] = useState<{ current_count: number; remaining_free: number }>({
    current_count: 0,
    remaining_free: FREE_KHUTBAHS_PER_MONTH
  });
  const [downloadingAudio, setDownloadingAudio] = useState(false);

  // Check if user is admin and get user ID
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.roles?.includes('admin') || false);

        // Load token balance and monthly usage
        loadTokenBalance(user.id);
        loadMonthlyUsage(user.id);
      }
    };
    checkAdmin();
  }, []);

  // Load token balance
  const loadTokenBalance = async (uid: string) => {
    const { data } = await supabase
      .from('user_tokens')
      .select('tokens_remaining')
      .eq('user_id', uid)
      .maybeSingle();
    setTokenBalance(data?.tokens_remaining || 0);
  };

  // Load monthly khutbah usage
  const loadMonthlyUsage = async (uid: string) => {
    const { data, error } = await supabase.rpc('check_khutbah_usage', {
      p_user_id: uid
    });
    if (!error && data) {
      setMonthlyUsage({
        current_count: data.current_count || 0,
        remaining_free: data.remaining_free || FREE_KHUTBAHS_PER_MONTH
      });
    }
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownloadPDF = async () => {
    if (!khutba || downloadingPDF) return;

    setDownloadingPDF(true);
    try {
      // Generate HTML with proper Arabic fonts on the client side
      const htmlContent = generateKhutbaHTML(khutba, duration, audience);

      // Open HTML in new tab - user can then print to PDF with proper Arabic rendering
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        toast.success('Khutbah opened in new tab. Use Print (Ctrl/Cmd + P) to save as PDF with proper Arabic fonts.');
      } else {
        // Fallback: download as HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khutba-${khutba.title.replace(/\s+/g, '-').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('HTML file downloaded. Open it in a browser and print to PDF for best Arabic rendering.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating document. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Generate audio version of khutbah (admin only)
  const generateAudio = async () => {
    if (!khutba || generatingAudio) return;

    setGeneratingAudio(true);
    setAudioUrl(null);

    try {
      // Build the khutbah text for audio (English parts only for clarity)
      let audioText = `${khutba.title}.\n\n`;
      audioText += `First Khutbah.\n\n`;

      // Opening translations
      audioText += `${KHUTBA_ARABIC.opening_praise.translation}\n\n`;
      audioText += `${KHUTBA_ARABIC.testimony.translation}\n\n`;
      audioText += `${KHUTBA_ARABIC.amma_badu.translation}\n\n`;
      audioText += `From the Quran: ${KHUTBA_ARABIC.opening_verse.translation}\n\n`;

      // Main content
      if (khutba.first_khutbah?.main_content) {
        audioText += `${khutba.first_khutbah.main_content.introduction}\n\n`;

        // Quran evidence
        if (khutba.first_khutbah.main_content.quran_evidence?.length > 0) {
          audioText += `From the Quran:\n`;
          khutba.first_khutbah.main_content.quran_evidence.forEach((v: any) => {
            audioText += `${v.translation}. ${v.reference}.\n`;
            if (v.explanation) audioText += `${v.explanation}\n`;
          });
          audioText += '\n';
        }

        // Hadith evidence
        if (khutba.first_khutbah.main_content.hadith_evidence?.length > 0) {
          audioText += `From the Hadith:\n`;
          khutba.first_khutbah.main_content.hadith_evidence.forEach((h: any) => {
            audioText += `${h.translation}. ${h.reference}.\n`;
            if (h.explanation) audioText += `${h.explanation}\n`;
          });
          audioText += '\n';
        }

        // Practical application
        if (khutba.first_khutbah.main_content.practical_application?.length > 0) {
          audioText += `Practical Application:\n`;
          khutba.first_khutbah.main_content.practical_application.forEach((p: string, i: number) => {
            audioText += `${i + 1}. ${p}\n`;
          });
          audioText += '\n';
        }

        audioText += `${khutba.first_khutbah.main_content.call_to_action}\n\n`;
      }

      audioText += `${KHUTBA_ARABIC.first_khutbah_closing.translation}\n\n`;
      audioText += `The Khateeb sits briefly.\n\n`;

      // Second Khutbah
      audioText += `Second Khutbah.\n\n`;
      audioText += `${KHUTBA_ARABIC.second_opening.translation}\n\n`;

      if (khutba.second_khutbah?.reminder) {
        audioText += `${khutba.second_khutbah.reminder}\n\n`;
      }

      audioText += `${KHUTBA_ARABIC.dua_ummah.translation}\n`;
      audioText += `${KHUTBA_ARABIC.dua_oppressed.translation}\n\n`;
      audioText += `${KHUTBA_ARABIC.salawat.translation}\n`;
      audioText += `May Allah's peace and blessings be upon him.\n`;

      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-khutba-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: audioText }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast.error(`Error generating audio: ${error.message}`);
    } finally {
      setGeneratingAudio(false);
    }
  };

  // Audio playback controls
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const downloadAudio = async () => {
    if (!audioUrl || !khutba || !userId) return;

    if (tokenBalance < KHUTBAH_AUDIO_TOKEN_COST) {
      toast.error(`You need ${KHUTBAH_AUDIO_TOKEN_COST} tokens to download audio.`, {
        action: {
          label: 'Buy Tokens',
          onClick: () => navigate('/buy-credits?tab=tokens')
        }
      });
      return;
    }

    setDownloadingAudio(true);
    try {
      // Deduct tokens
      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: userId,
        p_tokens: KHUTBAH_AUDIO_TOKEN_COST,
        p_feature: 'khutbah_audio',
        p_notes: `Downloaded audio for khutbah: ${khutba.title}`
      });

      if (deductError || !deductResult?.success) {
        throw new Error(deductResult?.error || 'Failed to deduct tokens');
      }
      setTokenBalance(deductResult.new_balance);

      // Download the file
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `khutba-${khutba.title.replace(/\s+/g, '-').toLowerCase()}.mp3`;
      link.click();

      toast.success(`Audio downloaded! ${KHUTBAH_AUDIO_TOKEN_COST} tokens used.`);
    } catch (error: any) {
      console.error('Error downloading audio:', error);
      toast.error(error.message || 'Error downloading audio');
    } finally {
      setDownloadingAudio(false);
    }
  };

  // Load saved khutbahs
  const loadSavedKhutbahs = async () => {
    if (!userId) return;
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('saved_khutbahs')
        .select('id, title, topic, duration, audience, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedKhutbahs(data || []);
    } catch (error: any) {
      console.error('Error loading saved khutbahs:', error);
      toast.error('Error loading saved khutbahs');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Load a specific saved khutbah
  const loadSavedKhutbah = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_khutbahs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setKhutba(data.content);
        setTopic(data.topic);
        setDuration(data.duration);
        setAudience(data.audience);
        setSavedKhutbahId(data.id);
        setSaved(true);
        setShowSavedKhutbahs(false);
        toast.success('Khutbah loaded!');
        setTimeout(() => {
          khutbaRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error: any) {
      console.error('Error loading khutbah:', error);
      toast.error('Error loading khutbah');
    }
  };

  // Delete a saved khutbah
  const deleteSavedKhutbah = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_khutbahs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedKhutbahs(prev => prev.filter(k => k.id !== id));
      if (savedKhutbahId === id) {
        setSavedKhutbahId(null);
        setSaved(false);
      }
      toast.success('Khutbah deleted');
    } catch (error: any) {
      console.error('Error deleting khutbah:', error);
      toast.error('Error deleting khutbah');
    }
  };

  // Toggle saved khutbahs panel
  const toggleSavedKhutbahs = () => {
    if (!showSavedKhutbahs && savedKhutbahs.length === 0) {
      loadSavedKhutbahs();
    }
    setShowSavedKhutbahs(!showSavedKhutbahs);
  };

  // Save khutbah to database
  const saveKhutbah = async () => {
    if (!khutba || !userId || saving) return;

    setSaving(true);
    try {
      const khutbahData = {
        user_id: userId,
        title: khutba.title,
        topic: topic || khutba.title,
        duration: duration,
        audience: audience,
        content: khutba
      };

      const { data, error } = await supabase
        .from('saved_khutbahs')
        .insert(khutbahData)
        .select('id')
        .single();

      if (error) throw error;

      setSaved(true);
      setSavedKhutbahId(data.id);
      toast.success('Khutbah saved successfully!');

      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving khutbah:', error);
      toast.error(`Error saving khutbah: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  async function generateKhutba(selectedTopic?: string) {
    const topicToUse = selectedTopic || topic.trim();
    if (!topicToUse || loading) return;

    const { data: { user } } = await supabase.auth.getUser();

    // Check if user needs to pay tokens (after free limit)
    const needsTokens = monthlyUsage.remaining_free <= 0;

    if (needsTokens && user) {
      if (tokenBalance < KHUTBAH_TEXT_TOKEN_COST) {
        toast.error(`You've used your ${FREE_KHUTBAHS_PER_MONTH} free khutbahs this month. You need ${KHUTBAH_TEXT_TOKEN_COST} tokens for additional khutbahs.`, {
          action: {
            label: 'Buy Tokens',
            onClick: () => navigate('/buy-credits?tab=tokens')
          }
        });
        return;
      }
    }

    setLoading(true);
    setKhutba(null);
    setSaved(false);
    setSavedKhutbahId(null);

    try {
      // Deduct tokens if beyond free limit
      if (needsTokens && user) {
        const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
          p_user_id: user.id,
          p_tokens: KHUTBAH_TEXT_TOKEN_COST,
          p_feature: 'khutbah_text',
          p_notes: `Generated khutbah: ${topicToUse}`
        });

        if (deductError || !deductResult?.success) {
          throw new Error(deductResult?.error || 'Failed to deduct tokens');
        }
        setTokenBalance(deductResult.new_balance);
        toast.success(`${KHUTBAH_TEXT_TOKEN_COST} tokens used`);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-khutba`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            topic: topicToUse,
            duration,
            audience,
            user_id: user?.id || null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate khutba');
      }

      const result = await response.json();
      setKhutba(result);

      // Increment usage count
      if (user) {
        await supabase.rpc('increment_khutbah_usage', { p_user_id: user.id });
        // Reload usage
        loadMonthlyUsage(user.id);
      }

      setTimeout(() => {
        khutbaRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Error generating khutba:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function copyKhutba() {
    if (!khutba) return;

    // Format khutba as text
    let text = `${khutba.title}\n${'='.repeat(50)}\n\n`;
    text += `Duration: ${duration} | Audience: ${audience}\n\n`;

    text += `FIRST KHUTBAH\n${'-'.repeat(30)}\n\n`;
    text += `Opening Praise:\n${KHUTBA_ARABIC.opening_praise.arabic}\n${KHUTBA_ARABIC.opening_praise.transliteration}\n${KHUTBA_ARABIC.opening_praise.translation}\n\n`;
    text += `Testimony of Faith:\n${KHUTBA_ARABIC.testimony.arabic}\n${KHUTBA_ARABIC.testimony.transliteration}\n${KHUTBA_ARABIC.testimony.translation}\n\n`;
    text += `To Proceed (Amma Ba'du):\n${KHUTBA_ARABIC.amma_badu.arabic}\n${KHUTBA_ARABIC.amma_badu.transliteration}\n${KHUTBA_ARABIC.amma_badu.translation}\n\n`;
    text += `Opening Verse (${KHUTBA_ARABIC.opening_verse.reference}):\n${KHUTBA_ARABIC.opening_verse.arabic}\n${KHUTBA_ARABIC.opening_verse.transliteration}\n${KHUTBA_ARABIC.opening_verse.translation}\n\n`;

    if (khutba.first_khutbah?.main_content) {
      text += `MAIN CONTENT\n${'-'.repeat(20)}\n\n`;
      text += `Introduction:\n${khutba.first_khutbah.main_content.introduction}\n\n`;

      if (khutba.first_khutbah.main_content.quran_evidence?.length > 0) {
        text += `Quranic Evidence:\n`;
        khutba.first_khutbah.main_content.quran_evidence.forEach((v: any) => {
          text += `${v.arabic || ''}\n${v.transliteration || ''}\n${v.translation || ''}\n(${v.reference || ''})\n\n`;
        });
      }

      if (khutba.first_khutbah.main_content.hadith_evidence?.length > 0) {
        text += `Hadith Evidence:\n`;
        khutba.first_khutbah.main_content.hadith_evidence.forEach((h: any) => {
          text += `${h.arabic || ''}\n${h.transliteration || ''}\n${h.translation || ''}\n(${h.reference || ''})\n\n`;
        });
      }

      if (khutba.first_khutbah.main_content.practical_application?.length > 0) {
        text += `Practical Application:\n`;
        khutba.first_khutbah.main_content.practical_application.forEach((p: string, i: number) => {
          text += `${i + 1}. ${p}\n`;
        });
        text += '\n';
      }

      text += `Call to Action:\n${khutba.first_khutbah.main_content.call_to_action}\n\n`;
    }

    text += `Closing of First Khutbah:\n${KHUTBA_ARABIC.first_khutbah_closing.arabic}\n${KHUTBA_ARABIC.first_khutbah_closing.transliteration}\n${KHUTBA_ARABIC.first_khutbah_closing.translation}\n\n`;

    text += `[KHATEEB SITS BRIEFLY]\n\n`;

    text += `SECOND KHUTBAH\n${'-'.repeat(30)}\n\n`;
    text += `Opening:\n${KHUTBA_ARABIC.second_opening.arabic}\n${KHUTBA_ARABIC.second_opening.transliteration}\n${KHUTBA_ARABIC.second_opening.translation}\n\n`;

    if (khutba.second_khutbah?.reminder) {
      text += `Reminder:\n${khutba.second_khutbah.reminder}\n\n`;
    }

    text += `Dua for the Ummah:\n${KHUTBA_ARABIC.dua_ummah.arabic}\n${KHUTBA_ARABIC.dua_ummah.transliteration}\n${KHUTBA_ARABIC.dua_ummah.translation}\n\n`;
    text += `${KHUTBA_ARABIC.dua_oppressed.arabic}\n${KHUTBA_ARABIC.dua_oppressed.transliteration}\n${KHUTBA_ARABIC.dua_oppressed.translation}\n\n`;

    text += `Final Salawat (${KHUTBA_ARABIC.salawat.reference}):\n${KHUTBA_ARABIC.salawat.arabic}\n${KHUTBA_ARABIC.salawat.transliteration}\n${KHUTBA_ARABIC.salawat.translation}\n\n`;

    text += `صلى الله عليه وسلم\nMay Allah's peace and blessings be upon him.\n\n`;

    if (khutba.sources?.length > 0) {
      text += `SOURCES\n${'-'.repeat(20)}\n`;
      khutba.sources.forEach(s => {
        text += `• ${s}\n`;
      });
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🕌</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Khutbah Creator</h1>
                <p className="text-xs text-gray-500">Generate Authentic Friday Khutbahs</p>
              </div>
            </div>

            {/* Token and Usage Display */}
            {userId && (
              <div className="flex items-center gap-3">
                {/* Free usage indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">
                    {monthlyUsage.remaining_free > 0 ? (
                      <>{monthlyUsage.remaining_free} free left</>
                    ) : (
                      <span className="text-amber-600">Free limit reached</span>
                    )}
                  </span>
                </div>

                {/* Token balance */}
                <button
                  onClick={() => navigate('/buy-credits?tab=tokens')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-sm transition"
                >
                  <Coins className="w-4 h-4 text-violet-600" />
                  <span className="text-violet-700 font-medium">{tokenBalance} tokens</span>
                </button>

                <button
                  onClick={toggleSavedKhutbahs}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition border border-emerald-200"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>My Saved Khutbahs</span>
                </button>
              </div>
            )}
            {!userId && <div className="w-32"></div>}
          </div>
        </div>
      </header>

      {/* Saved Khutbahs Panel */}
      {showSavedKhutbahs && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
            onClick={() => setShowSavedKhutbahs(false)}
            aria-hidden="true"
          ></div>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-khutbahs-title"
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-6 h-6 text-emerald-600" />
                <h2 id="saved-khutbahs-title" className="text-xl font-bold text-gray-900">My Saved Khutbahs</h2>
              </div>
              <button
                onClick={() => setShowSavedKhutbahs(false)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingSaved ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-gray-500">Loading saved khutbahs...</p>
                </div>
              ) : savedKhutbahs.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No saved khutbahs yet</p>
                  <p className="text-gray-400 text-sm mt-1">Generate and save a khutbah to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedKhutbahs.map((khutbah) => (
                    <div
                      key={khutbah.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => loadSavedKhutbah(khutbah.id)}>
                          <h3 className="font-semibold text-gray-900 mb-1">{khutbah.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">{khutbah.topic}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {DURATION_OPTIONS.find(d => d.value === khutbah.duration)?.label || khutbah.duration}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {AUDIENCE_OPTIONS.find(a => a.value === khutbah.audience)?.label || khutbah.audience}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Saved {new Date(khutbah.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() => loadSavedKhutbah(khutbah.id)}
                            className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-lg transition"
                            title="Load khutbah"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSavedKhutbah(khutbah.id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                            title="Delete khutbah"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <main id="main-content" className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Friday Khutbah
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Generate complete, authentic khutbahs following the Quran and Sunnah.
            Perfect for school Jummah, youth groups, or community masajid.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
          {/* Step 1: Duration & Audience - FIRST */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-gray-900 text-sm font-bold">1</span>
              <h3 className="text-lg font-semibold text-gray-900">Choose Duration & Audience</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Duration */}
              <div>
                <label htmlFor="khutbah-duration" className="block text-gray-900 font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                  Duration
                </label>
                <select
                  id="khutbah-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as 'short' | 'medium' | 'long')}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience */}
              <div>
                <label htmlFor="khutbah-audience" className="block text-gray-900 font-medium mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-emerald-600" />
                  Audience
                </label>
                <select
                  id="khutbah-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {AUDIENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Topic Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-gray-900 text-sm font-bold">2</span>
              <h3 className="text-lg font-semibold text-gray-900">Select or Enter Topic</h3>
            </div>

            {/* Topic Input */}
            <div className="mb-4">
              <label htmlFor="khutbah-topic" className="sr-only">Khutbah topic</label>
              <input
                id="khutbah-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Importance of Prayer, Patience in Difficult Times..."
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Topic Suggestions */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">Or choose from suggested topics (will generate immediately):</p>
              <div className="space-y-4">
                {Object.entries(TOPIC_CATEGORIES).map(([key, category]) => (
                  <div key={key}>
                    <p className="text-sm text-emerald-600 font-medium mb-3">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.topics.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setTopic(suggestion);
                            generateKhutba(suggestion);
                          }}
                          disabled={loading}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-500/20 text-gray-600 hover:text-cyan-300 rounded-full text-sm transition border border-gray-300/50 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generateKhutba()}
            disabled={!topic.trim() || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-gray-900 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Khutbah...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Khutbah</span>
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 mb-8 text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Khutbah</h3>
            <p className="text-gray-500">Finding authentic Quran verses and Hadith for your topic...</p>
            <p className="text-gray-500 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Generated Khutba */}
        {khutba && (
          <div ref={khutbaRef} className="bg-white border border-emerald-500/30 rounded-2xl overflow-hidden">
            {/* Khutba Header */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-blue-600/20 px-8 py-6 border-b border-emerald-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium mb-1">Friday Khutbah</p>
                  <h3 className="text-2xl font-bold text-gray-900">{khutba.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {DURATION_OPTIONS.find(d => d.value === duration)?.label}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Save button */}
                  {userId && (
                    <button
                      onClick={saveKhutbah}
                      disabled={saving || saved}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        saved
                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : saved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}</span>
                    </button>
                  )}
                  <button
                    onClick={copyKhutba}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Opens in new tab - use Print to save as PDF"
                  >
                    {downloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{downloadingPDF ? 'Generating...' : 'Print/PDF'}</span>
                  </button>
                  {/* Audio button - admin only */}
                  {isAdmin && (
                    <button
                      onClick={generateAudio}
                      disabled={generatingAudio}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-500/80 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                      <span>{generatingAudio ? 'Generating...' : 'Audio'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Player - shown when audio is generated */}
            {audioUrl && (
              <div className="mx-8 mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-900 font-medium">Audio Version Ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePlayback}
                      className="p-2 bg-purple-600 hover:bg-purple-500 text-gray-900 rounded-full transition"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={stopPlayback}
                      className="p-2 bg-gray-200 hover:bg-gray-200 text-gray-900 rounded-full transition"
                    >
                      <StopCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={downloadAudio}
                      disabled={downloadingAudio}
                      className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      {downloadingAudio ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download MP3</span>
                      <span className="text-xs bg-violet-500 px-1.5 py-0.5 rounded">{KHUTBAH_AUDIO_TOKEN_COST} tokens</span>
                    </button>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}

            {/* Khutba Content */}
            <div className="p-8 space-y-8">
              {/* FIRST KHUTBAH */}
              <div>
                <h4 className="text-xl font-bold text-emerald-600 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  FIRST KHUTBAH
                </h4>

                {/* Opening Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_opening')}
                    aria-expanded={expandedSections.first_opening}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-gray-900">Opening</h5>
                    {expandedSections.first_opening ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {expandedSections.first_opening && (
                    <div className="space-y-6 pl-4 border-l-2 border-emerald-500/30">
                      {/* Opening Praise */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-sm text-emerald-600 font-medium mb-3">Opening Praise</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-4" dir="rtl">
                          {KHUTBA_ARABIC.opening_praise.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.opening_praise.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.opening_praise.translation}
                        </p>
                      </div>

                      {/* Testimony */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-sm text-emerald-600 font-medium mb-3">Testimony of Faith</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.testimony.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.testimony.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.testimony.translation}
                        </p>
                      </div>

                      {/* Amma Ba'du */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-sm text-emerald-600 font-medium mb-3">To Proceed (Amma Ba'du)</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.amma_badu.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.amma_badu.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.amma_badu.translation}
                        </p>
                      </div>

                      {/* Opening Verse */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        <p className="text-sm text-emerald-400 font-medium mb-3">Opening Verse ({KHUTBA_ARABIC.opening_verse.reference})</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.opening_verse.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.opening_verse.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.opening_verse.translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_content')}
                    aria-expanded={expandedSections.first_content}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-amber-400" />
                      Main Content
                    </h5>
                    {expandedSections.first_content ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {expandedSections.first_content && khutba.first_khutbah?.main_content && (
                    <div className="space-y-6 pl-4 border-l-2 border-amber-500/30">
                      {/* Introduction */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-sm text-amber-400 font-medium mb-3">Introduction</p>
                        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                          {khutba.first_khutbah.main_content.introduction}
                        </p>
                      </div>

                      {/* Quran Evidence */}
                      {khutba.first_khutbah.main_content.quran_evidence?.length > 0 && (
                        <div>
                          <p className="text-xs text-emerald-400 font-medium mb-3">Quranic Evidence</p>
                          <div className="space-y-4">
                            {khutba.first_khutbah.main_content.quran_evidence.map((verse: any, idx: number) => (
                              <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                                {verse.arabic && (
                                  <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                                    {verse.arabic}
                                  </p>
                                )}
                                {verse.transliteration && (
                                  <p className="text-gray-500 italic text-base mb-3">
                                    {verse.transliteration}
                                  </p>
                                )}
                                <p className="text-gray-700 text-base mb-3">{verse.translation}</p>
                                {verse.reference && (
                                  <p className="text-emerald-400 text-sm font-medium">{verse.reference}</p>
                                )}
                                {verse.explanation && (
                                  <p className="text-gray-500 text-sm mt-2 pt-2 border-t border-emerald-500/20">
                                    {verse.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hadith Evidence */}
                      {khutba.first_khutbah.main_content.hadith_evidence?.length > 0 && (
                        <div>
                          <p className="text-xs text-amber-400 font-medium mb-3">Hadith Evidence</p>
                          <div className="space-y-4">
                            {khutba.first_khutbah.main_content.hadith_evidence.map((hadith: any, idx: number) => (
                              <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
                                {hadith.arabic && (
                                  <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                                    {hadith.arabic}
                                  </p>
                                )}
                                {hadith.transliteration && (
                                  <p className="text-gray-500 italic text-base mb-3">
                                    {hadith.transliteration}
                                  </p>
                                )}
                                <p className="text-gray-700 text-base mb-3">{hadith.translation}</p>
                                {hadith.reference && (
                                  <p className="text-amber-400 text-sm font-medium">{hadith.reference}</p>
                                )}
                                {hadith.explanation && (
                                  <p className="text-gray-500 text-sm mt-2 pt-2 border-t border-amber-500/20">
                                    {hadith.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Practical Application */}
                      {khutba.first_khutbah.main_content.practical_application?.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-5">
                          <p className="text-xs text-emerald-600 font-medium mb-3">Practical Application</p>
                          <ul className="space-y-2">
                            {khutba.first_khutbah.main_content.practical_application.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start text-gray-700">
                                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-emerald-600 text-sm">
                                  {idx + 1}
                                </span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Call to Action */}
                      {khutba.first_khutbah.main_content.call_to_action && (
                        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-5">
                          <p className="text-sm text-emerald-600 font-medium mb-3">Call to Action</p>
                          <p className="text-gray-700 font-medium">
                            {khutba.first_khutbah.main_content.call_to_action}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* First Khutbah Closing */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_closing')}
                    aria-expanded={expandedSections.first_closing}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-gray-900">Closing of First Khutbah</h5>
                    {expandedSections.first_closing ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {expandedSections.first_closing && (
                    <div className="pl-4 border-l-2 border-emerald-500/30">
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.first_khutbah_closing.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.first_khutbah_closing.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.first_khutbah_closing.translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sitting Moment */}
                <div className="bg-gray-50 rounded-xl p-4 text-center my-8">
                  <p className="text-gray-500 italic">[ KHATEEB SITS BRIEFLY ]</p>
                </div>
              </div>

              {/* SECOND KHUTBAH */}
              <div>
                <h4 className="text-xl font-bold text-blue-400 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  SECOND KHUTBAH
                </h4>

                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('second_khutbah')}
                    aria-expanded={expandedSections.second_khutbah}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-gray-900">Content</h5>
                    {expandedSections.second_khutbah ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {expandedSections.second_khutbah && (
                    <div className="space-y-6 pl-4 border-l-2 border-blue-500/30">
                      {/* Opening */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-sm text-blue-400 font-medium mb-3">Opening Praise</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.second_opening.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.second_opening.transliteration}
                        </p>
                        <p className="text-gray-700 text-base leading-relaxed">
                          {KHUTBA_ARABIC.second_opening.translation}
                        </p>
                      </div>

                      {/* Reminder */}
                      {khutba.second_khutbah?.reminder && (
                        <div className="bg-gray-50 rounded-xl p-5">
                          <p className="text-sm text-blue-400 font-medium mb-3">Brief Reminder</p>
                          <p className="text-gray-700 text-base leading-relaxed">
                            {khutba.second_khutbah.reminder}
                          </p>
                        </div>
                      )}

                      {/* Duas */}
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                        <p className="text-sm text-purple-400 font-medium mb-3">Dua for the Ummah</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xl md:text-2xl text-gray-900 font-arabic leading-relaxed text-right mb-2" dir="rtl">
                              {KHUTBA_ARABIC.dua_ummah.arabic}
                            </p>
                            <p className="text-gray-500 italic text-base mb-2">
                              {KHUTBA_ARABIC.dua_ummah.transliteration}
                            </p>
                            <p className="text-gray-700 text-base leading-relaxed">
                              {KHUTBA_ARABIC.dua_ummah.translation}
                            </p>
                          </div>
                          <div>
                            <p className="text-xl md:text-2xl text-gray-900 font-arabic leading-relaxed text-right mb-2" dir="rtl">
                              {KHUTBA_ARABIC.dua_oppressed.arabic}
                            </p>
                            <p className="text-gray-500 italic text-base mb-2">
                              {KHUTBA_ARABIC.dua_oppressed.transliteration}
                            </p>
                            <p className="text-gray-700 text-base leading-relaxed">
                              {KHUTBA_ARABIC.dua_oppressed.translation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Salawat */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        <p className="text-sm text-emerald-400 font-medium mb-3">Final Salawat ({KHUTBA_ARABIC.salawat.reference})</p>
                        <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.salawat.arabic}
                        </p>
                        <p className="text-gray-500 italic text-base mb-3">
                          {KHUTBA_ARABIC.salawat.transliteration}
                        </p>
                        <p className="text-gray-600 mb-4">
                          {KHUTBA_ARABIC.salawat.translation}
                        </p>
                        <p className="text-3xl md:text-4xl text-gray-900 font-arabic text-center" dir="rtl">
                          صلى الله عليه وسلم
                        </p>
                        <p className="text-gray-600 text-center text-sm mt-1">
                          May Allah's peace and blessings be upon him.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sources */}
              {khutba.sources && khutba.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Sources</h5>
                  <div className="flex flex-wrap gap-2">
                    {khutba.sources.map((source, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
