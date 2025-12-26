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

// Fixed Arabic text for khutba structure - Complete Khutbatul Hajah
const KHUTBA_ARABIC = {
  opening_praise: {
    arabic: 'إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ، وَنَعُوذُ بِاللَّهِ مِنْ شُرُورِ أَنْفُسِنَا وَمِنْ سَيِّئَاتِ أَعْمَالِنَا، مَنْ يَهْدِهِ اللَّهُ فَلَا مُضِلَّ لَهُ، وَمَنْ يُضْلِلْ فَلَا هَادِيَ لَهُ',
    transliteration: "Innal hamda lillahi nahmaduhu wa nasta'eenahu wa nastaghfiruhu, wa na'oodhu billahi min shuroori anfusina wa min sayyi'aati a'maalina. Man yahdihillahu fala mudilla lah, wa man yudlil fala haadiya lah.",
    translation: 'Indeed, all praise is due to Allah. We praise Him, seek His help and His forgiveness. We seek refuge in Allah from the evil of our souls and from our bad deeds. Whomever Allah guides, no one can misguide, and whomever Allah leads astray, no one can guide.'
  },
  testimony: {
    arabic: 'وَأَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: "Wa ashhadu an la ilaha illallahu wahdahu la shareeka lah, wa ashhadu anna Muhammadan 'abduhu wa rasooluhu.",
    translation: 'I bear witness that there is no deity worthy of worship except Allah alone, with no partner, and I bear witness that Muhammad is His slave and messenger.'
  },
  amma_badu: {
    arabic: 'أَمَّا بَعْدُ، فَإِنَّ أَصْدَقَ الْحَدِيثِ كِتَابُ اللَّهِ، وَخَيْرَ الْهُدَىٰ هُدَىٰ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَشَرَّ الْأُمُورِ مُحْدَثَاتُهَا، وَكُلَّ مُحْدَثَةٍ بِدْعَةٌ، وَكُلَّ بِدْعَةٍ ضَلَالَةٌ، وَكُلَّ ضَلَالَةٍ فِي النَّارِ',
    transliteration: "Amma ba'du, fa inna asdaqal hadeethi kitabullah, wa khayral hudaa hudaa Muhammadin sallallahu 'alayhi wa sallam, wa sharral umoori muhdathatuha, wa kulla muhdathatin bid'ah, wa kulla bid'atin dalalah, wa kulla dalalatin fin naar.",
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateKhutbaHTML(khutba: KhutbaContent, duration: string, audience: string): string {
  const durationLabel = duration === 'short' ? 'Short (3-5 min)' : duration === 'medium' ? 'Medium (7-10 min)' : 'Long (12-15 min)';
  const audienceLabel = audience === 'youth' ? 'Youth/Students' : audience === 'new_muslims' ? 'New Muslims' : 'General Community';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(khutba.title)} - Friday Khutbah</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .arabic {
      font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', serif;
      font-size: 1.5rem;
      line-height: 2.2;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      margin: 12px 0;
    }

    .transliteration {
      font-style: italic;
      color: #64748b;
      margin: 8px 0;
      font-size: 0.95rem;
    }

    .translation {
      color: #334155;
      margin: 8px 0;
      font-size: 1rem;
    }

    .reference {
      color: #10b981;
      font-weight: 600;
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .header {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .header .meta {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-header {
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .section-header.blue {
      background: #3b82f6;
    }

    .section-header.amber {
      background: #f59e0b;
    }

    .section-header.purple {
      background: #8b5cf6;
    }

    .content-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .quran-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    .hadith-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }

    .dua-box {
      background: #f3e8ff;
      border: 1px solid #ddd6fe;
    }

    .divider {
      border-top: 2px dashed #e2e8f0;
      margin: 32px 0;
      text-align: center;
      position: relative;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      color: #94a3b8;
      font-style: italic;
      position: relative;
      top: -12px;
    }

    .khutbah-banner {
      background: #3b82f6;
      color: white;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      margin: 24px 0;
    }

    .practical-list {
      list-style: none;
      padding: 0;
    }

    .practical-list li {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .practical-list .number {
      background: #10b981;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
      padding-top: 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .sources {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .sources h3 {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 8px;
    }

    .sources ul {
      list-style: disc;
      padding-left: 20px;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .print-instruction {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 0.875rem;
      color: #92400e;
    }

    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
      .print-instruction {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-instruction">
    <strong>To save as PDF:</strong> Press <kbd>Ctrl</kbd>+<kbd>P</kbd> (Windows) or <kbd>Cmd</kbd>+<kbd>P</kbd> (Mac) and select "Save as PDF" as the destination.
  </div>

  <div class="header">
    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Friday Khutbah</div>
    <h1>${escapeHtml(khutba.title)}</h1>
    <div class="meta">${durationLabel} | ${audienceLabel} | ${dateStr}</div>
  </div>

  <div class="khutbah-banner">FIRST KHUTBAH</div>

  <div class="section">
    <div class="section-header">Opening Praise</div>
    <div class="content-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.opening_praise.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.opening_praise.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.opening_praise.translation)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Testimony of Faith</div>
    <div class="content-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.testimony.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.testimony.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.testimony.translation)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">To Proceed (Amma Ba'du)</div>
    <div class="content-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.amma_badu.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.amma_badu.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.amma_badu.translation)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header blue">Opening Verse</div>
    <div class="content-box quran-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.opening_verse.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.opening_verse.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.opening_verse.translation)}</div>
      <div class="reference">[${KHUTBA_ARABIC.opening_verse.reference}]</div>
    </div>
  </div>`;

  // Main Content
  if (khutba.first_khutbah?.main_content) {
    const mc = khutba.first_khutbah.main_content;

    if (mc.introduction) {
      html += `
  <div class="section">
    <div class="section-header amber">Introduction</div>
    <div class="content-box">
      <div class="translation">${escapeHtml(mc.introduction)}</div>
    </div>
  </div>`;
    }

    if (mc.quran_evidence && mc.quran_evidence.length > 0) {
      html += `
  <div class="section">
    <div class="section-header">Quranic Evidence</div>`;
      for (const verse of mc.quran_evidence) {
        html += `
    <div class="content-box quran-box">`;
        if (verse.arabic) html += `<div class="arabic">${escapeHtml(verse.arabic)}</div>`;
        if (verse.transliteration) html += `<div class="transliteration">${escapeHtml(verse.transliteration)}</div>`;
        if (verse.translation) html += `<div class="translation">${escapeHtml(verse.translation)}</div>`;
        if (verse.reference) html += `<div class="reference">[${escapeHtml(verse.reference)}]</div>`;
        if (verse.explanation) html += `<div class="translation" style="margin-top: 8px; font-style: italic; color: #64748b;">${escapeHtml(verse.explanation)}</div>`;
        html += `
    </div>`;
      }
      html += `
  </div>`;
    }

    if (mc.hadith_evidence && mc.hadith_evidence.length > 0) {
      html += `
  <div class="section">
    <div class="section-header amber">Hadith Evidence</div>`;
      for (const hadith of mc.hadith_evidence) {
        html += `
    <div class="content-box hadith-box">`;
        if (hadith.arabic) html += `<div class="arabic">${escapeHtml(hadith.arabic)}</div>`;
        if (hadith.transliteration) html += `<div class="transliteration">${escapeHtml(hadith.transliteration)}</div>`;
        if (hadith.translation) html += `<div class="translation">${escapeHtml(hadith.translation)}</div>`;
        if (hadith.reference) html += `<div class="reference">[${escapeHtml(hadith.reference)}]</div>`;
        if (hadith.explanation) html += `<div class="translation" style="margin-top: 8px; font-style: italic; color: #64748b;">${escapeHtml(hadith.explanation)}</div>`;
        html += `
    </div>`;
      }
      html += `
  </div>`;
    }

    if (mc.practical_application && mc.practical_application.length > 0) {
      html += `
  <div class="section">
    <div class="section-header">Practical Application</div>
    <div class="content-box">
      <ul class="practical-list">`;
      mc.practical_application.forEach((point, idx) => {
        html += `
        <li>
          <span class="number">${idx + 1}</span>
          <span>${escapeHtml(point)}</span>
        </li>`;
      });
      html += `
      </ul>
    </div>
  </div>`;
    }

    if (mc.call_to_action) {
      html += `
  <div class="section">
    <div class="section-header blue">Call to Action</div>
    <div class="content-box" style="background: #eff6ff; border-color: #bfdbfe;">
      <div class="translation" style="font-weight: 500;">${escapeHtml(mc.call_to_action)}</div>
    </div>
  </div>`;
    }
  }

  html += `
  <div class="section">
    <div class="section-header">Closing of First Khutbah</div>
    <div class="content-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.first_khutbah_closing.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.first_khutbah_closing.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.first_khutbah_closing.translation)}</div>
    </div>
  </div>

  <div class="divider"><span>[ KHATEEB SITS BRIEFLY ]</span></div>

  <div class="khutbah-banner">SECOND KHUTBAH</div>

  <div class="section">
    <div class="section-header">Opening Praise</div>
    <div class="content-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.second_opening.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.second_opening.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.second_opening.translation)}</div>
    </div>
  </div>`;

  if (khutba.second_khutbah?.reminder) {
    html += `
  <div class="section">
    <div class="section-header" style="background: #64748b;">Brief Reminder</div>
    <div class="content-box">
      <div class="translation">${escapeHtml(khutba.second_khutbah.reminder)}</div>
    </div>
  </div>`;
  }

  html += `
  <div class="section">
    <div class="section-header purple">Dua for the Ummah</div>
    <div class="content-box dua-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.dua_ummah.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.dua_ummah.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.dua_ummah.translation)}</div>
    </div>
    <div class="content-box dua-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.dua_oppressed.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.dua_oppressed.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.dua_oppressed.translation)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Final Salawat</div>
    <div class="content-box quran-box">
      <div class="arabic">${escapeHtml(KHUTBA_ARABIC.salawat.arabic)}</div>
      <div class="transliteration">${escapeHtml(KHUTBA_ARABIC.salawat.transliteration)}</div>
      <div class="translation">${escapeHtml(KHUTBA_ARABIC.salawat.translation)}</div>
      <div class="reference">[${KHUTBA_ARABIC.salawat.reference}]</div>
    </div>
    <div class="content-box" style="text-align: center;">
      <div class="arabic" style="font-size: 2rem; text-align: center;">${escapeHtml(KHUTBA_ARABIC.final_salawat.arabic)}</div>
      <div class="translation" style="text-align: center; font-style: italic;">${escapeHtml(KHUTBA_ARABIC.final_salawat.translation)}</div>
    </div>
  </div>`;

  if (khutba.sources && khutba.sources.length > 0) {
    html += `
  <div class="sources">
    <h3>Sources</h3>
    <ul>`;
    for (const source of khutba.sources) {
      html += `<li>${escapeHtml(source)}</li>`;
    }
    html += `
    </ul>
  </div>`;
  }

  html += `
  <div class="footer">
    Generated by Talbiyah.ai | www.talbiyah.ai
  </div>
</body>
</html>`;

  return html;
}
