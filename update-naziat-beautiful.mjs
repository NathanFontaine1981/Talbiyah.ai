import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
);

const insightId = 'def6b825-f0c2-4058-bbe9-1a72c1720b56';

const detailedContent = `## Lesson Type: 📖 Understanding & Tadabbur

*This session focused on deeply understanding the meanings, themes, and reflections of the ayahs.*

---

## 🧾 Session Overview

| | |
|---|---|
| **Surah** | سُورَةُ النَّازِعَات — An-Nāziʿāt (The Extractors) |
| **Chapter** | 79 |
| **Ayahs** | 1–33 (ending at مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ) |
| **Theme** | Resurrection, Angels, Musa & Fir'awn, Allah's Creation |
| **Teacher** | Ustadh Osama Muhammad |
| **Date** | 30th November 2025 |

---

## 📖 Verses Studied

### Section 1: The Oaths of the Angels (آيات ١-٥)

| Arabic | Translation |
|--------|-------------|
| وَالنَّازِعَاتِ غَرْقًا | By those [angels] who extract with violence |
| وَالنَّاشِطَاتِ نَشْطًا | And those who remove with ease |
| وَالسَّابِحَاتِ سَبْحًا | And those who glide swimming |
| فَالسَّابِقَاتِ سَبْقًا | And those who race each other |
| فَالْمُدَبِّرَاتِ أَمْرًا | And those who arrange every matter |

### Section 2: The Day of Resurrection (آيات ٦-١٤)

| Arabic | Translation |
|--------|-------------|
| يَوْمَ تَرْجُفُ الرَّاجِفَةُ | The Day the earth shakes with quaking |
| تَتْبَعُهَا الرَّادِفَةُ | Followed by the subsequent [blast] |
| قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ | Hearts, that Day, will tremble |
| أَبْصَارُهَا خَاشِعَةٌ | Their eyes humbled |

### Section 3: Story of Musa & Fir'awn (آيات ١٥-٢٦)

| Arabic | Translation |
|--------|-------------|
| هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ | Has there reached you the story of Musa? |
| إِذْ نَادَاهُ رَبُّهُ بِالْوَادِ الْمُقَدَّسِ طُوًى | When his Lord called him in the sacred valley of Tuwa |
| اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ | "Go to Fir'awn. Indeed, he has transgressed" |
| فَقُلْ هَل لَّكَ إِلَىٰ أَن تَزَكَّىٰ | "Say: Would you purify yourself?" |
| فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ | He said, "I am your lord, most high" |
| فَأَخَذَهُ اللَّهُ نَكَالَ الْآخِرَةِ وَالْأُولَىٰ | So Allah seized him as an example |

### Section 4: Allah's Creation (آيات ٢٧-٣٣)

| Arabic | Translation |
|--------|-------------|
| أَأَنتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ ۚ بَنَاهَا | Are you harder to create, or the heaven? He built it |
| وَالْأَرْضَ بَعْدَ ذَٰلِكَ دَحَاهَا | And the earth, He spread it out |
| أَخْرَجَ مِنْهَا مَاءَهَا وَمَرْعَاهَا | He brought forth its water and pasture |
| وَالْجِبَالَ أَرْسَاهَا | And the mountains, He set firmly |
| مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ | As provision for you and your livestock |

---

## 🎯 Match the Meaning

*Can you match the English to the correct Arabic ayah?*

**1.** "By those who extract with violence"
- ○ وَالنَّاشِطَاتِ نَشْطًا
- ● وَالنَّازِعَاتِ غَرْقًا
- ○ فَالسَّابِقَاتِ سَبْقًا

**2.** "Go to Fir'awn. Indeed, he has transgressed"
- ○ هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ
- ○ فَقُلْ هَل لَّكَ إِلَىٰ أَن تَزَكَّىٰ
- ● اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ

**3.** "I am your lord, most high"
- ● فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ
- ○ إِنَّهُ طَغَىٰ
- ○ فَأَخَذَهُ اللَّهُ نَكَالَ الْآخِرَةِ

**4.** "Hearts, that Day, will tremble"
- ○ أَبْصَارُهَا خَاشِعَةٌ
- ● قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ
- ○ تَتْبَعُهَا الرَّادِفَةُ

**5.** "As provision for you and your livestock"
- ○ وَالْجِبَالَ أَرْسَاهَا
- ○ أَخْرَجَ مِنْهَا مَاءَهَا وَمَرْعَاهَا
- ● مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ

---

## 🧠 Focus Words

*Master these words to unlock the Surah:*

| Arabic | Sounds Like | Meaning | Remember It |
|--------|-------------|---------|-------------|
| النَّازِعَات | an-naazi'aat | extractors | Angels who *pull* souls out |
| غَرْقًا | ghar-qan | violently | Like *drowning* — intense |
| طَغَىٰ | ta-ghaa | transgressed | Fir'awn *went too far* |
| تَزَكَّىٰ | ta-zak-kaa | purify yourself | From *zakah* — to cleanse |
| الرَّاجِفَة | ar-raaji-fah | the quaking | Earth *shaking* violently |
| وَاجِفَة | waa-ji-fah | trembling | Hearts *shaking* with fear |
| خَاشِعَة | khaa-shi'ah | humbled | Eyes *lowered* in shame |
| دَحَاهَا | da-haa-haa | spread it out | Allah *stretched* the earth |
| أَرْسَاهَا | ar-saa-haa | set firmly | Mountains *anchored* down |
| مَتَاع | ma-taa' | provision | Temporary *enjoyment* |
| أَنْعَام | an-'aam | livestock | Your *animals* and cattle |

---

## 📚 Understanding the Message

### 🔷 The Angels (Ayahs 1-5)

Allah opens with powerful oaths about the angels:

> **النَّازِعَات** — These angels extract the souls of the disbelievers *harshly*, like pulling something stuck deeply.
> 
> **النَّاشِطَات** — These angels gently release the souls of the believers, like untying a soft knot.

*The contrast is powerful: how you lived determines how your soul departs.*

### 🔷 The Day of Terror (Ayahs 6-14)

Two blasts will shake everything:
- **الرَّاجِفَة** — The first blast that kills all creation
- **الرَّادِفَة** — The second blast that resurrects everyone

On that Day, even the arrogant will have **trembling hearts** (قُلُوبٌ وَاجِفَةٌ) and **humbled eyes** (أَبْصَارُهَا خَاشِعَةٌ).

### 🔷 Fir'awn's Arrogance (Ayahs 15-26)

Allah asks: *"Has the story of Musa reached you?"*

The lesson is clear:
1. **طَغَىٰ** — Fir'awn transgressed all limits
2. Musa invited him gently: *"Would you purify yourself?"*
3. Fir'awn responded with ultimate arrogance: **أَنَا رَبُّكُمُ الْأَعْلَىٰ** — "I am your highest lord"
4. Allah seized him as a warning: **نَكَالَ الْآخِرَةِ وَالْأُولَىٰ**

*No matter how powerful you think you are, Allah is greater.*

### 🔷 The Proof of Resurrection (Ayahs 27-33)

Allah's powerful argument:

> **أَأَنتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ**
> "Are YOU harder to create, or the heavens?"

He built the sky, spread the earth, brought water, grew pasture, anchored mountains — all as **مَتَاع** (provision) for you.

*If Allah created all of this, bringing you back to life is easy.*

---

## 💭 Tadabbur: Reflect & Apply

Take a moment with each question:

| Ayah | Reflection |
|------|------------|
| 79:1-2 | How do I want my soul to be taken — harshly or gently? What am I doing to prepare? |
| 79:8-9 | My heart will tremble that Day. What makes it tremble with fear of Allah *today*? |
| 79:17 | Musa was sent to the most powerful tyrant. What difficult task is Allah asking of me? |
| 79:24 | Fir'awn claimed to be the highest. In what small ways do I put my ego above Allah's commands? |
| 79:33 | Everything I enjoy is مَتَاع — temporary provision. Am I grateful enough? |

---

## 🔑 First Word Prompts

*Memorise the first word of each ayah to remember the order:*

| Ayah | First Word | Meaning | Full Ayah Starts... |
|------|------------|---------|---------------------|
| 1 | وَالنَّازِعَاتِ | By the extractors | وَالنَّازِعَاتِ غَرْقًا |
| 2 | وَالنَّاشِطَاتِ | By the removers | وَالنَّاشِطَاتِ نَشْطًا |
| 3 | وَالسَّابِحَاتِ | By the gliders | وَالسَّابِحَاتِ سَبْحًا |
| 4 | فَالسَّابِقَاتِ | By the racers | فَالسَّابِقَاتِ سَبْقًا |
| 5 | فَالْمُدَبِّرَاتِ | By the arrangers | فَالْمُدَبِّرَاتِ أَمْرًا |
| 15 | هَلْ | Has there... | هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ |
| 17 | اذْهَبْ | Go! | اذْهَبْ إِلَىٰ فِرْعَوْنَ |
| 24 | فَقَالَ | So he said | فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ |
| 27 | أَأَنتُمْ | Are you...? | أَأَنتُمْ أَشَدُّ خَلْقًا |
| 33 | مَتَاعًا | As provision | مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ |

---

## 📈 Progress

\`\`\`
Section 1 (1-5)    ████████████ ✅ Understood
Section 2 (6-14)   ████████░░░░ 🔄 Reviewing  
Section 3 (15-26)  ████████████ ✅ Understood
Section 4 (27-33)  ████████████ ✅ Understood
\`\`\`

---

## 📝 Homework

### This Week's Focus:

**1. Vocabulary Mastery**
- [ ] Learn all 11 focus words
- [ ] Test yourself: cover English, recall meaning

**2. Ayah Recognition**
- [ ] Complete the "Match the Meaning" quiz from memory
- [ ] Practice until you score 5/5

**3. First Word Drill**
- [ ] Cover the ayahs, look at first word only
- [ ] Can you recall what comes next?

**4. Tadabbur Journal**
- [ ] Pick ONE reflection question
- [ ] Write 3-5 sentences on how it applies to your life

**5. Prepare for Next Session**
- [ ] Read ayahs 34-46 with translation
- [ ] Note any words you don't understand

---

## ✨ Key Takeaways

1. **How you live = how your soul departs** — believers' souls are taken gently, disbelievers' harshly

2. **Fir'awn's sin was طُغْيَان (transgression)** — claiming to be the highest lord when only Allah is

3. **Allah's creation proves resurrection** — if He made the heavens, earth, and mountains, raising you is easy

4. **Everything is مَتَاع** — temporary provision. Use it wisely, be grateful, don't become attached

5. **Hearts will tremble, eyes will be humbled** — prepare now so you're not among the terrified

---

## 💬 Verse to Carry With You

<div style="text-align: center; font-size: 1.3em; padding: 20px;">

قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ ۝ أَبْصَارُهَا خَاشِعَةٌ

*"Hearts, that Day, will tremble. Their eyes humbled."*

— Surah An-Nazi'at, 79:8-9

</div>`;

const updateData = {
  title: "Surah An-Nazi'at (79) — Ayahs 1-33",
  summary: "Understanding & Tadabbur session on Surah An-Nazi'at. Explored the oaths about angels extracting souls, Fir'awn's arrogance and downfall, and Allah's creation as proof of resurrection. Key vocabulary: طَغَىٰ (transgressed), مَتَاع (provision), وَاجِفَة (trembling).",
  key_topics: [
    "Angels & soul extraction",
    "Fir'awn's transgression (طَغَىٰ)",
    "Day of Resurrection",
    "Allah's creation as proof",
    "Provision (مَتَاع) for mankind"
  ],
  areas_of_strength: [
    "Strong engagement with meanings",
    "Good comprehension of themes",
    "Active reflection on tadabbur"
  ],
  areas_for_improvement: [
    "Memorise focus vocabulary",
    "Practice first-word prompts",
    "Complete ayah matching quiz"
  ],
  recommendations: [
    "Learn 11 focus words this week",
    "Use first-word prompts to memorise order",
    "Write tadabbur reflection on Fir'awn's arrogance",
    "Prepare ayahs 34-46 for next session"
  ],
  detailed_insights: {
    content: detailedContent,
    metadata: {
      generated_at: new Date().toISOString(),
      source: "lesson_content",
      model: "quran_insight_template_v3",
      lesson_type: "understanding_tadabbur",
      lesson_date: "2025-11-30",
      teacher: "Osama Muhammad",
      student: "Nathan Fontaine",
      duration_minutes: 45,
      subject: "Quran with Understanding",
      surah_name: "An-Nazi'at",
      surah_number: 79,
      ayah_range: "1-33",
      focus_words: ["طَغَىٰ", "تَزَكَّىٰ", "وَاجِفَة", "خَاشِعَة", "دَحَاهَا", "مَتَاع", "أَنْعَام"],
      themes: ["angels", "resurrection", "musa_firaun", "creation", "provision"]
    }
  },
  student_participation_score: 90,
  ai_model: "quran_insight_template_v3",
  confidence_score: 0.95
};

async function updateInsight() {
  console.log('Creating beautiful, tailored Quran insight...');
  
  const { data, error } = await supabase
    .from('lesson_insights')
    .update(updateData)
    .eq('id', insightId)
    .select('id, title, summary');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Beautiful Quran study notes created!');
  console.log(JSON.stringify(data, null, 2));
}

updateInsight();
