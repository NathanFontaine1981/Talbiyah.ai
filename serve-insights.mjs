import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3001;

const insights = {
  'quran-understanding': {
    title: '🕌 Quran Understanding (Tadabbur) - Surah Al-Mulk',
    file: 'quran-understanding-surah-mulk.md'
  },
  'quran-fluency': {
    title: '🕌 Quran Fluency (Tajweed) - Surah Al-Fatiha',
    file: 'quran-fluency-surah-fatiha.md'
  },
  'quran-memorization': {
    title: '🕌 Quran Memorization (Hifz) - Surah Al-Asr',
    file: 'quran-memorization-surah-asr.md'
  },
  'arabic-language': {
    title: '📚 Arabic Language - Daily Activities',
    file: 'ARABIC_LANGUAGE_INSIGHT_EXAMPLE.md'
  }
};

createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(join(__dirname, 'insights-preview.html')));
  } else if (req.url.startsWith('/insight/')) {
    const insightKey = req.url.replace('/insight/', '');
    const insight = insights[insightKey];

    if (insight) {
      try {
        const content = readFileSync(join(__dirname, 'test-data', insight.file), 'utf-8');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ title: insight.title, content }));
      } catch (error) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'File not found' }));
      }
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Insight not found' }));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port);

console.log(`🚀 Insights preview server running at http://localhost:${port}`);
console.log(`\n📖 Available insights:`);
Object.keys(insights).forEach(key => {
  console.log(`   - ${insights[key].title}`);
});
console.log(`\n✨ Open http://localhost:${port} in your browser!`);
