import jsPDF from 'jspdf';

interface KhutbaContent {
  title: string;
  duration: string;
  audience: string;
  first_khutbah?: {
    main_content?: {
      introduction?: string;
      quran_evidence?: Array<{
        arabic?: string;
        transliteration?: string;
        translation?: string;
        reference?: string;
        explanation?: string;
      }>;
      hadith_evidence?: Array<{
        arabic?: string;
        transliteration?: string;
        translation?: string;
        reference?: string;
        explanation?: string;
      }>;
      practical_application?: string[];
      call_to_action?: string;
    };
  };
  second_khutbah?: {
    reminder?: string;
  };
  sources?: string[];
}

// Fixed Arabic text components for khutba structure
const KHUTBA_ARABIC = {
  opening_praise: {
    arabic: 'إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ، وَنَعُوذُ بِاللَّهِ مِنْ شُرُورِ أَنْفُسِنَا وَمِنْ سَيِّئَاتِ أَعْمَالِنَا، مَنْ يَهْدِهِ اللَّهُ فَلَا مُضِلَّ لَهُ، وَمَنْ يُضْلِلْ فَلَا هَادِيَ لَهُ. وَأَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ. أَمَّا بَعْدُ، فَإِنَّ أَصْدَقَ الْحَدِيثِ كِتَابُ اللَّهِ، وَخَيْرَ الْهُدَىٰ هُدَىٰ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَشَرَّ الْأُمُورِ مُحْدَثَاتُهَا، وَكُلَّ مُحْدَثَةٍ بِدْعَةٌ، وَكُلَّ بِدْعَةٍ ضَلَالَةٌ، وَكُلَّ ضَلَالَةٍ فِي النَّارِ',
    transliteration: "Innal hamda lillahi nahmaduhu wa nasta'eenahu wa nastaghfiruhu, wa na'oodhu billahi min shuroori anfusina wa min sayyi'aati a'maalina. Man yahdihillahu fala mudilla lah, wa man yudlil fala haadiya lah. Wa ashhadu an la ilaha illallahu wahdahu la shareeka lah, wa ashhadu anna Muhammadan 'abduhu wa rasooluhu. Amma ba'du, fa inna asdaqal hadeethi kitabullah, wa khayral hudaa hudaa Muhammadin sallallahu 'alayhi wa sallam, wa sharral umoori muhdathatuha, wa kulla muhdathatin bid'ah, wa kulla bid'atin dalalah, wa kulla dalalatin fin naar.",
    translation: 'Indeed, all praise is due to Allah. We praise Him, seek His help and His forgiveness. We seek refuge in Allah from the evil of our souls and from our bad deeds. Whomever Allah guides, no one can misguide, and whomever Allah leads astray, no one can guide. I bear witness that there is no deity worthy of worship except Allah alone, with no partner, and I bear witness that Muhammad is His slave and messenger. To proceed: Indeed, the most truthful speech is the Book of Allah, and the best guidance is the guidance of Muhammad ﷺ. The worst of affairs are newly invented matters, every newly invented matter is an innovation, every innovation is misguidance, and every misguidance is in the Fire.'
  },
  testimony: {
    arabic: 'وأشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمداً عبده ورسوله',
    transliteration: "Wa ashhadu an la ilaha illallah wahdahu la shareeka lah, wa ashhadu anna Muhammadan 'abduhu wa rasooluh.",
    translation: 'I bear witness that there is no deity worthy of worship except Allah alone, with no partners, and I bear witness that Muhammad is His slave and messenger.'
  },
  opening_verse: {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
    transliteration: 'Ya ayyuhallatheena aamanuttaqullaha haqqa tuqaatihi wa la tamootunna illa wa antum muslimoon.',
    translation: 'O you who believe! Fear Allah as He should be feared, and die not except in a state of Islam.',
    reference: 'Aal-Imran 3:102'
  },
  first_khutbah_closing: {
    arabic: 'أقول قولي هذا وأستغفر الله لي ولكم ولسائر المسلمين من كل ذنب فاستغفروه إنه هو الغفور الرحيم',
    transliteration: "Aqoolu qawli hadha wa astaghfirullaha li wa lakum wa lisa'iril muslimeena min kulli dhanbin fastaghfiroohu innahu huwal ghafoorur raheem.",
    translation: 'I say these words and I seek forgiveness from Allah for myself, for you, and for all Muslims from every sin. So seek His forgiveness; indeed He is the Most Forgiving, Most Merciful.'
  },
  second_opening: {
    arabic: 'الحمد لله رب العالمين، والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين',
    transliteration: "Alhamdulillahi rabbil 'aalameen, wassalatu wassalamu 'ala nabiyyina Muhammad wa 'ala aalihi wa sahbihi ajma'een.",
    translation: "All praise is due to Allah, Lord of the worlds, and may Allah's peace and blessings be upon our Prophet Muhammad, his family, and all his companions."
  },
  dua_ummah: {
    arabic: 'اللهم أعز الإسلام والمسلمين، وأذل الشرك والمشركين، ودمر أعداء الدين',
    transliteration: "Allahumma a'izzal Islama wal Muslimeen, wa adhillash shirka wal mushrikeen, wa dammir a'daa'ad deen.",
    translation: 'O Allah, grant honor to Islam and the Muslims, and humiliate shirk and the mushrikeen, and destroy the enemies of the religion.'
  },
  dua_oppressed: {
    arabic: 'اللهم انصر إخواننا المستضعفين في كل مكان',
    transliteration: "Allahumman-sur ikhwananal mustad'afeena fi kulli makaan.",
    translation: 'O Allah, grant victory to our oppressed brothers and sisters everywhere.'
  },
  salawat: {
    arabic: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا',
    transliteration: "Innallaha wa mala'ikatahu yusalloona 'alan nabiyy. Ya ayyuhallatheena aamanu sallu 'alayhi wa sallimu tasleema.",
    translation: "Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace.",
    reference: 'Al-Ahzab 33:56'
  },
  final_salawat: {
    arabic: 'صلى الله عليه وسلم',
    translation: "May Allah's peace and blessings be upon him."
  }
};

// Arabic font loading
let arabicFontLoaded = false;
let arabicFontBase64: string | null = null;

async function loadArabicFont(): Promise<string | null> {
  if (arabicFontBase64) return arabicFontBase64;

  try {
    const fontUrls = [
      'https://fonts.gstatic.com/s/amiriquran/v7/_Xm4-HfI5MFmLCUOWR0HcLKqYxI.ttf',
      'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf',
      'https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0z9_Mnuw.ttf'
    ];

    for (const url of fontUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          arabicFontBase64 = btoa(binary);
          return arabicFontBase64;
        }
      } catch (e) {
        // Font URL failed, try next
      }
    }
    throw new Error('All font URLs failed');
  } catch (error) {
    console.error('Failed to load Arabic font:', error);
    return null;
  }
}

async function setupArabicFont(doc: jsPDF): Promise<boolean> {
  if (arabicFontLoaded && arabicFontBase64) {
    doc.addFileToVFS('AmiriQuran-Regular.ttf', arabicFontBase64);
    doc.addFont('AmiriQuran-Regular.ttf', 'AmiriQuran', 'normal');
    return true;
  }

  const fontData = await loadArabicFont();
  if (fontData) {
    doc.addFileToVFS('AmiriQuran-Regular.ttf', fontData);
    doc.addFont('AmiriQuran-Regular.ttf', 'AmiriQuran', 'normal');
    arabicFontLoaded = true;
    return true;
  }
  return false;
}

// PDF generation with proper Arabic support
class KhutbaPDFGenerator {
  private pdf: jsPDF;
  private y: number = 20;
  private pageWidth: number = 210;
  private pageHeight: number = 297;
  private marginLeft: number = 15;
  private marginRight: number = 15;
  private marginBottom: number = 20;
  private contentWidth: number;
  private hasArabicFont: boolean = false;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
  }

  async init(): Promise<void> {
    this.hasArabicFont = await setupArabicFont(this.pdf);
  }

  private checkPageBreak(neededHeight: number): void {
    if (this.y + neededHeight > this.pageHeight - this.marginBottom) {
      this.pdf.addPage();
      this.y = 20;
    }
  }

  private addArabicText(text: string, fontSize: number, x: number, maxWidth?: number): number {
    if (!this.hasArabicFont) {
      // Fallback: show transliteration note
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('[Arabic text - see transliteration below]', x, this.y);
      return 6;
    }

    this.pdf.setFont('AmiriQuran', 'normal');
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(30, 30, 30);

    // For Arabic, we need to handle RTL properly
    const width = maxWidth || this.contentWidth;
    const lines = this.pdf.splitTextToSize(text, width);
    const lineHeight = fontSize * 0.6;
    let totalHeight = 0;

    for (const line of lines) {
      this.checkPageBreak(lineHeight);
      // Right-align Arabic text
      this.pdf.text(line, this.pageWidth - this.marginRight, this.y, { align: 'right' });
      this.y += lineHeight;
      totalHeight += lineHeight;
    }

    return totalHeight;
  }

  private addText(text: string, fontSize: number, color: [number, number, number], options: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}): void {
    const { bold = false, italic = false, align = 'left', maxWidth = this.contentWidth } = options;

    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(color[0], color[1], color[2]);

    const fontStyle = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
    this.pdf.setFont('helvetica', fontStyle);

    const lines = this.pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.45;

    for (const line of lines) {
      this.checkPageBreak(lineHeight);

      let xPos = this.marginLeft;
      if (align === 'center') {
        xPos = this.pageWidth / 2;
      } else if (align === 'right') {
        xPos = this.pageWidth - this.marginRight;
      }

      this.pdf.text(line, xPos, this.y, { align });
      this.y += lineHeight;
    }
  }

  private addSectionHeader(title: string, bgColor: [number, number, number]): void {
    this.checkPageBreak(12);
    this.y += 3;

    this.pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    this.pdf.roundedRect(this.marginLeft, this.y - 5, this.contentWidth, 9, 2, 2, 'F');

    this.pdf.setFontSize(10);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title.toUpperCase(), this.marginLeft + 4, this.y);

    this.y += 10;
  }

  private addArabicBlock(arabic: string, transliteration: string, translation: string, reference?: string): void {
    // Calculate needed height
    const estimatedHeight = 45 + (reference ? 6 : 0);
    this.checkPageBreak(estimatedHeight);

    // Background box
    const startY = this.y - 2;
    this.pdf.setFillColor(250, 250, 252);
    this.pdf.setDrawColor(220, 220, 230);
    this.pdf.roundedRect(this.marginLeft, startY, this.contentWidth, estimatedHeight, 3, 3, 'FD');

    this.y += 4;

    // Arabic text (right-aligned, Uthmani script)
    if (arabic && this.hasArabicFont) {
      this.pdf.setFont('AmiriQuran', 'normal');
      this.pdf.setFontSize(16);
      this.pdf.setTextColor(20, 20, 20);

      const arabicLines = this.pdf.splitTextToSize(arabic, this.contentWidth - 10);
      for (const line of arabicLines) {
        this.pdf.text(line, this.pageWidth - this.marginRight - 5, this.y, { align: 'right' });
        this.y += 8;
      }
      this.y += 2;
    } else if (arabic) {
      // Fallback when font not loaded
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(120, 120, 120);
      this.pdf.text('[Arabic text available in app]', this.marginLeft + 5, this.y);
      this.y += 6;
    }

    // Transliteration (italic)
    if (transliteration) {
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(100, 116, 139);
      const transLines = this.pdf.splitTextToSize(transliteration, this.contentWidth - 10);
      for (const line of transLines) {
        this.pdf.text(line, this.marginLeft + 5, this.y);
        this.y += 5;
      }
      this.y += 2;
    }

    // Translation
    if (translation) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(51, 65, 85);
      const translationLines = this.pdf.splitTextToSize(translation, this.contentWidth - 10);
      for (const line of translationLines) {
        this.pdf.text(line, this.marginLeft + 5, this.y);
        this.y += 5;
      }
    }

    // Reference
    if (reference) {
      this.y += 2;
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(16, 185, 129);
      this.pdf.text(`[${reference}]`, this.marginLeft + 5, this.y);
      this.y += 5;
    }

    this.y += 6;
  }

  private addContentBlock(text: string, bgColor: [number, number, number] = [248, 250, 252]): void {
    const lines = this.pdf.splitTextToSize(text, this.contentWidth - 10);
    const boxHeight = (lines.length * 5) + 10;

    this.checkPageBreak(boxHeight);

    this.pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    this.pdf.roundedRect(this.marginLeft, this.y - 2, this.contentWidth, boxHeight, 3, 3, 'F');

    this.y += 4;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(51, 65, 85);

    for (const line of lines) {
      this.pdf.text(line, this.marginLeft + 5, this.y);
      this.y += 5;
    }

    this.y += 6;
  }

  async generate(khutba: KhutbaContent): Promise<jsPDF> {
    await this.init();

    const durationLabel = khutba.duration === 'short' ? 'Short (3-5 min)' : khutba.duration === 'medium' ? 'Medium (7-10 min)' : 'Long (12-15 min)';
    const audienceLabel = khutba.audience === 'youth' ? 'Youth/Students' : khutba.audience === 'new_muslims' ? 'New Muslims' : 'General Community';
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Header
    this.pdf.setFillColor(16, 185, 129);
    this.pdf.roundedRect(this.marginLeft, this.y, this.contentWidth, 28, 4, 4, 'F');

    this.y += 7;
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('FRIDAY KHUTBAH', this.marginLeft + 5, this.y);

    this.y += 7;
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    const titleLines = this.pdf.splitTextToSize(khutba.title, this.contentWidth - 10);
    this.pdf.text(titleLines[0], this.marginLeft + 5, this.y);

    this.y += 7;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`${durationLabel} | ${audienceLabel} | ${dateStr}`, this.marginLeft + 5, this.y);

    this.y += 15;

    // First Khutbah Banner
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.roundedRect(this.marginLeft, this.y, this.contentWidth, 10, 3, 3, 'F');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('FIRST KHUTBAH', this.pageWidth / 2, this.y + 7, { align: 'center' });
    this.y += 16;

    // Opening sections with Arabic
    this.addSectionHeader('Opening Praise', [16, 185, 129]);
    this.addArabicBlock(
      KHUTBA_ARABIC.opening_praise.arabic,
      KHUTBA_ARABIC.opening_praise.transliteration,
      KHUTBA_ARABIC.opening_praise.translation
    );

    this.addSectionHeader('Testimony of Faith', [16, 185, 129]);
    this.addArabicBlock(
      KHUTBA_ARABIC.testimony.arabic,
      KHUTBA_ARABIC.testimony.transliteration,
      KHUTBA_ARABIC.testimony.translation
    );

    this.addSectionHeader('Opening Verse', [59, 130, 246]);
    this.addArabicBlock(
      KHUTBA_ARABIC.opening_verse.arabic,
      KHUTBA_ARABIC.opening_verse.transliteration,
      KHUTBA_ARABIC.opening_verse.translation,
      KHUTBA_ARABIC.opening_verse.reference
    );

    // Main Content
    if (khutba.first_khutbah?.main_content) {
      const content = khutba.first_khutbah.main_content;

      if (content.introduction) {
        this.addSectionHeader('Introduction', [245, 158, 11]);
        this.addContentBlock(content.introduction, [255, 251, 235]);
      }

      if (content.quran_evidence && content.quran_evidence.length > 0) {
        this.addSectionHeader('Quranic Evidence', [16, 185, 129]);
        for (const verse of content.quran_evidence) {
          this.addArabicBlock(
            verse.arabic || '',
            verse.transliteration || '',
            verse.translation || '',
            verse.reference
          );
          if (verse.explanation) {
            this.addText(verse.explanation, 9, [100, 116, 139], { italic: true });
            this.y += 3;
          }
        }
      }

      if (content.hadith_evidence && content.hadith_evidence.length > 0) {
        this.addSectionHeader('Hadith Evidence', [245, 158, 11]);
        for (const hadith of content.hadith_evidence) {
          this.addArabicBlock(
            hadith.arabic || '',
            hadith.transliteration || '',
            hadith.translation || '',
            hadith.reference
          );
          if (hadith.explanation) {
            this.addText(hadith.explanation, 9, [100, 116, 139], { italic: true });
            this.y += 3;
          }
        }
      }

      if (content.practical_application && content.practical_application.length > 0) {
        this.addSectionHeader('Practical Application', [16, 185, 129]);

        const totalLines = content.practical_application.reduce((acc, point) => {
          return acc + this.pdf.splitTextToSize(point, this.contentWidth - 20).length;
        }, 0);
        const boxHeight = (totalLines * 5) + (content.practical_application.length * 3) + 10;

        this.checkPageBreak(boxHeight);

        this.pdf.setFillColor(248, 250, 252);
        this.pdf.roundedRect(this.marginLeft, this.y - 2, this.contentWidth, boxHeight, 3, 3, 'F');

        this.y += 4;

        content.practical_application.forEach((point, idx) => {
          const lines = this.pdf.splitTextToSize(point, this.contentWidth - 18);

          this.pdf.setFillColor(16, 185, 129);
          this.pdf.circle(this.marginLeft + 7, this.y - 1.5, 2.5, 'F');
          this.pdf.setFontSize(8);
          this.pdf.setTextColor(255, 255, 255);
          this.pdf.text(`${idx + 1}`, this.marginLeft + 7, this.y - 0.5, { align: 'center' });

          this.pdf.setFont('helvetica', 'normal');
          this.pdf.setFontSize(10);
          this.pdf.setTextColor(51, 65, 85);

          for (let i = 0; i < lines.length; i++) {
            this.pdf.text(lines[i], this.marginLeft + 14, this.y);
            this.y += 5;
          }
          this.y += 1;
        });

        this.y += 5;
      }

      if (content.call_to_action) {
        this.addSectionHeader('Call to Action', [59, 130, 246]);
        this.addContentBlock(content.call_to_action, [239, 246, 255]);
      }
    }

    // Closing of First Khutbah
    this.addSectionHeader('Closing of First Khutbah', [16, 185, 129]);
    this.addArabicBlock(
      KHUTBA_ARABIC.first_khutbah_closing.arabic,
      KHUTBA_ARABIC.first_khutbah_closing.transliteration,
      KHUTBA_ARABIC.first_khutbah_closing.translation
    );

    // Sitting moment
    this.checkPageBreak(15);
    this.y += 3;
    this.pdf.setDrawColor(200, 200, 210);
    this.pdf.setLineDashPattern([2, 2], 0);
    this.pdf.line(this.marginLeft, this.y, this.pageWidth - this.marginRight, this.y);
    this.y += 5;
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(120, 130, 150);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text('[ KHATEEB SITS BRIEFLY ]', this.pageWidth / 2, this.y, { align: 'center' });
    this.y += 5;
    this.pdf.line(this.marginLeft, this.y, this.pageWidth - this.marginRight, this.y);
    this.pdf.setLineDashPattern([], 0);
    this.y += 10;

    // Second Khutbah Banner
    this.checkPageBreak(18);
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.roundedRect(this.marginLeft, this.y, this.contentWidth, 10, 3, 3, 'F');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('SECOND KHUTBAH', this.pageWidth / 2, this.y + 7, { align: 'center' });
    this.y += 16;

    // Second Khutbah content
    this.addSectionHeader('Opening Praise', [16, 185, 129]);
    this.addArabicBlock(
      KHUTBA_ARABIC.second_opening.arabic,
      KHUTBA_ARABIC.second_opening.transliteration,
      KHUTBA_ARABIC.second_opening.translation
    );

    if (khutba.second_khutbah?.reminder) {
      this.addSectionHeader('Brief Reminder', [100, 116, 139]);
      this.addContentBlock(khutba.second_khutbah.reminder);
    }

    // Duas
    this.addSectionHeader('Dua for the Ummah', [147, 51, 234]);
    this.addArabicBlock(
      KHUTBA_ARABIC.dua_ummah.arabic,
      KHUTBA_ARABIC.dua_ummah.transliteration,
      KHUTBA_ARABIC.dua_ummah.translation
    );
    this.addArabicBlock(
      KHUTBA_ARABIC.dua_oppressed.arabic,
      KHUTBA_ARABIC.dua_oppressed.transliteration,
      KHUTBA_ARABIC.dua_oppressed.translation
    );

    // Final Salawat
    this.addSectionHeader('Final Salawat', [16, 185, 129]);
    this.addArabicBlock(
      KHUTBA_ARABIC.salawat.arabic,
      KHUTBA_ARABIC.salawat.transliteration,
      KHUTBA_ARABIC.salawat.translation,
      KHUTBA_ARABIC.salawat.reference
    );

    // Final blessing with Arabic
    this.checkPageBreak(22);
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(this.marginLeft, this.y, this.contentWidth, 18, 3, 3, 'F');
    this.y += 6;

    if (this.hasArabicFont) {
      this.pdf.setFont('AmiriQuran', 'normal');
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(30, 30, 30);
      this.pdf.text(KHUTBA_ARABIC.final_salawat.arabic, this.pageWidth / 2, this.y, { align: 'center' });
    }

    this.y += 7;
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(100, 116, 139);
    this.pdf.text(KHUTBA_ARABIC.final_salawat.translation, this.pageWidth / 2, this.y, { align: 'center' });
    this.y += 12;

    // Sources
    if (khutba.sources && khutba.sources.length > 0) {
      this.checkPageBreak(18);
      this.pdf.setDrawColor(220, 225, 235);
      this.pdf.line(this.marginLeft, this.y, this.pageWidth - this.marginRight, this.y);
      this.y += 6;

      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('SOURCES', this.marginLeft, this.y);
      this.y += 5;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(140, 150, 165);
      const sourcesText = khutba.sources.join(' | ');
      const sourceLines = this.pdf.splitTextToSize(sourcesText, this.contentWidth);
      for (const line of sourceLines) {
        this.pdf.text(line, this.marginLeft, this.y);
        this.y += 4;
      }
      this.y += 5;
    }

    // Footer
    this.checkPageBreak(12);
    this.pdf.setDrawColor(220, 225, 235);
    this.pdf.line(this.marginLeft, this.y, this.pageWidth - this.marginRight, this.y);
    this.y += 5;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(150, 160, 175);
    this.pdf.text('Generated by Talbiyah.ai | www.talbiyah.ai', this.pageWidth / 2, this.y, { align: 'center' });

    return this.pdf;
  }
}

export async function downloadKhutbaPDF(khutba: KhutbaContent, filename?: string): Promise<void> {
  const generator = new KhutbaPDFGenerator();
  const pdf = await generator.generate(khutba);

  const safeName = filename || `khutba-${khutba.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(safeName);
}

export async function generateKhutbaPDF(khutba: KhutbaContent): Promise<jsPDF> {
  const generator = new KhutbaPDFGenerator();
  return generator.generate(khutba);
}
