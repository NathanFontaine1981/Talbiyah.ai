// Talbiyah teaching agreement / covenant.
// Bump AGREEMENT_VERSION to re-prompt all teachers to re-accept after material changes.
export const AGREEMENT_VERSION = '2026-06-1';

export interface AgreementSection {
  id: string;
  title: string;
  icon: string; // lucide icon name (resolved in the page)
  body: string; // markdown
}

export const AGREEMENT_INTRO = `
Assalāmu ʿalaykum, and welcome to the Talbiyah teaching family.

Teaching the Book of Allah is a noble trust (*amānah*). The Prophet ﷺ said:
*"The best of you are those who learn the Qur'an and teach it."* (al-Bukhārī)

Before you begin teaching, please read each section below carefully and confirm
that you understand and agree to uphold it. This protects your students, honours
the Qur'an, and keeps Talbiyah a place of excellence and trust.
`;

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'intention',
    title: 'Sincerity & Adab',
    icon: 'Heart',
    body: `
- I teach seeking the pleasure of **Allah** first, with *iḥsān* (excellence) in every lesson.
- I will treat every student — child or adult — with **patience, gentleness and respect**, never harshness, ridicule, or impatience.
- I will be a role model in **character and manners (adab)**, mindful that I represent the Qur'an and this platform.
- I will make du'ā for my students and genuinely care for their progress in this life and the next.
`,
  },
  {
    id: 'standards',
    title: 'Qur\'an Teaching Standards',
    icon: 'BookOpen',
    body: `
- I will teach **correct recitation** with sound **tajwīd** and accurate **makhārij** (articulation points), to the best of my ability.
- I will **only teach within my competence**. I will not present myself as qualified in an area (e.g. ijāzah, qirā'āt, advanced tajwīd) that I do not hold.
- My stated **qualifications and ijāzah are truthful** and I can evidence them if asked.
- I will **correct errors kindly but clearly**, never letting a mistake in the Qur'an pass uncorrected for fear of discomfort.
- I will follow the **Talbiyah method**: teaching the Qur'an by **theme**, taking each block of āyāt through the three layers in order — **Understanding → Fluency → Memorisation**.
`,
  },
  {
    id: 'safeguarding',
    title: 'Safeguarding & Child Protection',
    icon: 'ShieldCheck',
    body: `
This is the most important section. Many of our students are **children**.

- I will maintain **professional boundaries** at all times and never engage in inappropriate conversation, contact, or behaviour.
- I will keep **all communication on the Talbiyah platform**. I will not request or move to private contact (personal phone, social media, etc.) with students or minors.
- I understand lessons may be **recorded** for safeguarding and quality, and I consent to this.
- If I ever have a **safeguarding concern** about a child's welfare, I will report it immediately to Talbiyah admin.
- I will never be alone with a child off-platform, and I will respect that a parent/guardian may be present.
`,
  },
  {
    id: 'professionalism',
    title: 'Professionalism & Punctuality',
    icon: 'Clock',
    body: `
- I will **attend every booked lesson on time** and come **prepared**.
- I will join from a **quiet, appropriate environment** with a clear background, modest dress, and a working camera and microphone.
- If I must cancel, I will give **as much notice as possible** and never leave a student waiting without communication.
- Repeated lateness, no-shows, or unprofessional conduct may affect my standing on the platform.
`,
  },
  {
    id: 'honesty',
    title: 'Honesty in Records & AI Insights',
    icon: 'ClipboardCheck',
    body: `
- I will mark lessons **honestly**: a lesson that took place is *completed*; a student no-show is marked **as a no-show**, not as completed.
- I will not falsify attendance, hours, or progress to inflate earnings or ratings.
- I will provide **accurate, fair feedback** and homework so that AI lesson insights and student progress reflect reality.
- I understand that dishonest records may lead to removal from the platform.
`,
  },
  {
    id: 'payments',
    title: 'Payments & Platform Integrity',
    icon: 'BadgePoundSterling',
    body: `
- I will keep **all bookings and payments on Talbiyah** and will not solicit students to pay or book off-platform.
- I understand my payout rate, method and schedule are managed through my **Payment Settings**, and that payouts follow the platform's hold and clearing periods.
- I will keep my payout details **accurate and up to date**.
`,
  },
  {
    id: 'privacy',
    title: 'Student Privacy & Confidentiality',
    icon: 'Lock',
    body: `
- I will treat student information, recordings, and family details as **confidential**.
- I will not share, publish, or misuse any student data, image, or recording outside of delivering and improving their lessons on Talbiyah.
`,
  },
];
