import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';

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
    arabic: 'الحمد لله نحمده ونستعينه ونستغفره، ونعوذ بالله من شرور أنفسنا ومن سيئات أعمالنا، من يهده الله فلا مضل له، ومن يضلل فلا هادي له',
    transliteration: "Alhamdulillah, nahmaduhu wa nasta'eenahu wa nastaghfiruhu, wa na'oodhu billahi min shuroori anfusina wa min sayyi'aati a'maalina. Man yahdihillahu fala mudilla lah, wa man yudlil fala haadiya lah.",
    translation: 'All praise is due to Allah. We praise Him, seek His help and His forgiveness. We seek refuge in Allah from the evil of our souls and from our bad deeds. Whomever Allah guides, no one can misguide, and whomever Allah leaves astray, no one can guide.'
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

function createPrintableHTML(khutba: KhutbaContent): string {
  const durationLabel = khutba.duration === 'short' ? 'Short (3-5 min)' : khutba.duration === 'medium' ? 'Medium (7-10 min)' : 'Long (12-15 min)';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const renderArabicBlock = (arabic: string, transliteration: string, translation: string, reference?: string, bgColor = '#f8fafc') => `
    <div style="background: ${bgColor}; border-radius: 8px; padding: 20px; margin-bottom: 14px;">
      <p style="font-size: 26px; font-family: 'Amiri', 'Traditional Arabic', 'Noto Naskh Arabic', 'Arial', serif; direction: rtl; text-align: right; margin: 0 0 12px 0; line-height: 2.2; color: #1e293b;">
        ${arabic}
      </p>
      <p style="font-size: 11px; font-style: italic; color: #64748b; margin: 0 0 6px 0; line-height: 1.5;">
        ${transliteration}
      </p>
      <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.5;">
        ${translation}
      </p>
      ${reference ? `<p style="font-size: 11px; color: #0891b2; font-weight: 600; margin: 8px 0 0 0;">[${reference}]</p>` : ''}
    </div>
  `;

  const renderSectionHeader = (title: string, color = '#0891b2') => `
    <div style="background: ${color}; color: white; padding: 8px 12px; border-radius: 6px; margin: 16px 0 8px 0;">
      <p style="margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${title}</p>
    </div>
  `;

  let html = `
    <div id="khutba-pdf-content" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 210mm; padding: 20px; background: white; color: #1e293b;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="font-size: 10px; margin: 0 0 4px 0; opacity: 0.9;">FRIDAY KHUTBAH</p>
        <h1 style="font-size: 22px; margin: 0 0 8px 0; font-weight: 700;">${khutba.title}</h1>
        <p style="font-size: 11px; margin: 0; opacity: 0.85;">${durationLabel} | ${khutba.audience} | ${dateStr}</p>
      </div>

      <!-- First Khutbah -->
      <div style="background: #3b82f6; color: white; padding: 10px 16px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; letter-spacing: 1px;">FIRST KHUTBAH</p>
      </div>

      ${renderSectionHeader('Opening Praise')}
      ${renderArabicBlock(KHUTBA_ARABIC.opening_praise.arabic, KHUTBA_ARABIC.opening_praise.transliteration, KHUTBA_ARABIC.opening_praise.translation)}

      ${renderSectionHeader('Testimony of Faith')}
      ${renderArabicBlock(KHUTBA_ARABIC.testimony.arabic, KHUTBA_ARABIC.testimony.transliteration, KHUTBA_ARABIC.testimony.translation)}

      ${renderSectionHeader('Opening Verse', '#10b981')}
      ${renderArabicBlock(KHUTBA_ARABIC.opening_verse.arabic, KHUTBA_ARABIC.opening_verse.transliteration, KHUTBA_ARABIC.opening_verse.translation, KHUTBA_ARABIC.opening_verse.reference, '#ecfdf5')}
  `;

  // Main Content
  if (khutba.first_khutbah?.main_content) {
    const content = khutba.first_khutbah.main_content;

    if (content.introduction) {
      html += `
        ${renderSectionHeader('Introduction', '#f59e0b')}
        <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.6;">${content.introduction}</p>
        </div>
      `;
    }

    if (content.quran_evidence && content.quran_evidence.length > 0) {
      html += renderSectionHeader('Quranic Evidence', '#10b981');
      for (const verse of content.quran_evidence) {
        if (verse.arabic) {
          html += renderArabicBlock(verse.arabic, verse.transliteration || '', verse.translation || '', verse.reference, '#ecfdf5');
        } else if (verse.translation) {
          html += `
            <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #10b981;">
              <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.6;">"${verse.translation}"</p>
              ${verse.reference ? `<p style="font-size: 11px; color: #10b981; font-weight: 600; margin: 8px 0 0 0;">[${verse.reference}]</p>` : ''}
            </div>
          `;
        }
        if (verse.explanation) {
          html += `<p style="font-size: 11px; color: #64748b; font-style: italic; margin: 0 0 12px 16px; line-height: 1.5;">${verse.explanation}</p>`;
        }
      }
    }

    if (content.hadith_evidence && content.hadith_evidence.length > 0) {
      html += renderSectionHeader('Hadith Evidence', '#f59e0b');
      for (const hadith of content.hadith_evidence) {
        if (hadith.arabic) {
          html += renderArabicBlock(hadith.arabic, hadith.transliteration || '', hadith.translation || '', hadith.reference, '#fffbeb');
        } else if (hadith.translation) {
          html += `
            <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #f59e0b;">
              <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.6;">"${hadith.translation}"</p>
              ${hadith.reference ? `<p style="font-size: 11px; color: #f59e0b; font-weight: 600; margin: 8px 0 0 0;">[${hadith.reference}]</p>` : ''}
            </div>
          `;
        }
        if (hadith.explanation) {
          html += `<p style="font-size: 11px; color: #64748b; font-style: italic; margin: 0 0 12px 16px; line-height: 1.5;">${hadith.explanation}</p>`;
        }
      }
    }

    if (content.practical_application && content.practical_application.length > 0) {
      html += renderSectionHeader('Practical Application');
      html += `<div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px;">`;
      content.practical_application.forEach((point, idx) => {
        html += `
          <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="background: #0891b2; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; margin-right: 10px; flex-shrink: 0;">${idx + 1}</span>
            <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.5;">${point}</p>
          </div>
        `;
      });
      html += `</div>`;
    }

    if (content.call_to_action) {
      html += `
        ${renderSectionHeader('Call to Action', '#3b82f6')}
        <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #3b82f6;">
          <p style="font-size: 12px; color: #1e40af; margin: 0; line-height: 1.6; font-weight: 500;">${content.call_to_action}</p>
        </div>
      `;
    }
  }

  // Closing of First Khutbah
  html += `
    ${renderSectionHeader('Closing of First Khutbah')}
    ${renderArabicBlock(KHUTBA_ARABIC.first_khutbah_closing.arabic, KHUTBA_ARABIC.first_khutbah_closing.transliteration, KHUTBA_ARABIC.first_khutbah_closing.translation)}

    <!-- Sitting Moment -->
    <div style="text-align: center; padding: 16px 0; margin: 16px 0; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1;">
      <p style="font-size: 11px; color: #64748b; font-style: italic; margin: 0;">[ KHATEEB SITS BRIEFLY ]</p>
    </div>

    <!-- Second Khutbah -->
    <div style="background: #3b82f6; color: white; padding: 10px 16px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 14px; font-weight: 700; letter-spacing: 1px;">SECOND KHUTBAH</p>
    </div>

    ${renderSectionHeader('Opening Praise')}
    ${renderArabicBlock(KHUTBA_ARABIC.second_opening.arabic, KHUTBA_ARABIC.second_opening.transliteration, KHUTBA_ARABIC.second_opening.translation)}
  `;

  // Reminder
  if (khutba.second_khutbah?.reminder) {
    html += `
      ${renderSectionHeader('Brief Reminder')}
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.6;">${khutba.second_khutbah.reminder}</p>
      </div>
    `;
  }

  // Duas and Salawat
  html += `
    ${renderSectionHeader('Dua for the Ummah', '#9333ea')}
    ${renderArabicBlock(KHUTBA_ARABIC.dua_ummah.arabic, KHUTBA_ARABIC.dua_ummah.transliteration, KHUTBA_ARABIC.dua_ummah.translation, undefined, '#faf5ff')}
    ${renderArabicBlock(KHUTBA_ARABIC.dua_oppressed.arabic, KHUTBA_ARABIC.dua_oppressed.transliteration, KHUTBA_ARABIC.dua_oppressed.translation, undefined, '#faf5ff')}

    ${renderSectionHeader('Final Salawat', '#10b981')}
    ${renderArabicBlock(KHUTBA_ARABIC.salawat.arabic, KHUTBA_ARABIC.salawat.transliteration, KHUTBA_ARABIC.salawat.translation, KHUTBA_ARABIC.salawat.reference, '#ecfdf5')}

    <!-- Final Salawat -->
    <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 32px; font-family: 'Amiri', 'Traditional Arabic', 'Noto Naskh Arabic', 'Arial', serif; direction: rtl; margin: 0 0 12px 0; color: #1e293b; line-height: 1.8;">
        ${KHUTBA_ARABIC.final_salawat.arabic}
      </p>
      <p style="font-size: 12px; font-style: italic; color: #64748b; margin: 0;">${KHUTBA_ARABIC.final_salawat.translation}</p>
    </div>
  `;

  // Sources
  if (khutba.sources && khutba.sources.length > 0) {
    html += `
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px;">
        <p style="font-size: 10px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Sources</p>
        <p style="font-size: 10px; color: #94a3b8; margin: 0; line-height: 1.6;">${khutba.sources.join(' | ')}</p>
      </div>
    `;
  }

  // Footer
  html += `
      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 9px; color: #94a3b8; margin: 0;">Generated by Talbiyah.ai | www.talbiyah.ai</p>
      </div>
    </div>
  `;

  return html;
}

export async function downloadKhutbaPDF(khutba: KhutbaContent, filename?: string): Promise<void> {
  // Create a temporary container for the HTML
  const container = document.createElement('div');
  // Sanitize HTML to prevent XSS attacks
  container.innerHTML = DOMPurify.sanitize(createPrintableHTML(khutba));
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);

  try {
    // Wait a moment for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = container.querySelector('#khutba-pdf-content') as HTMLElement;

    // Use html2canvas to capture the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate dimensions for A4 PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const safeName = filename || `khutba-${khutba.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(safeName);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

// Keep this for backwards compatibility but mark as async
export async function generateKhutbaPDF(khutba: KhutbaContent): Promise<jsPDF> {
  const container = document.createElement('div');
  // Sanitize HTML to prevent XSS attacks
  container.innerHTML = DOMPurify.sanitize(createPrintableHTML(khutba));
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  document.body.appendChild(container);

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = container.querySelector('#khutba-pdf-content') as HTMLElement;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}
