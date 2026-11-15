import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

interface MentorRequestBody {
  world?: string;
  levelTitle?: string;
  lastError?: string;
  placedShapesSummary?: string;
  totalStars?: number;
  question?: string;
  localFallback?: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: Boolean(getGeminiClient()) });
  });

  app.post('/api/mentor/explain', async (req, res) => {
    const body = (req.body ?? {}) as MentorRequestBody;
    const fallback =
      body.localFallback ||
      'Periksa panjang sisi dan bentuk bangun pada grid. Pastikan sudut persegi/persegi panjang tepat 90°!';

    const ai = getGeminiClient();
    if (!ai) {
      res.json({ explanation: fallback, source: 'local' });
      return;
    }

    try {
      const promptParts = [
        `Konteks Dunia: ${body.world || 'belajar'}`,
        body.levelTitle ? `Level: ${body.levelTitle}` : '',
        typeof body.totalStars === 'number' ? `Bintang Siswa: ${body.totalStars}` : '',
        body.placedShapesSummary ? `Bentuk yang sudah dipasang siswa: ${body.placedShapesSummary}` : '',
        body.lastError ? `Kesalahan / Umpan balik terakhir: ${body.lastError}` : '',
        body.question ? `Pertanyaan siswa: ${body.question}` : 'Berikan 1 petunjuk ramah dan konkret untuk langkah berikutnya.',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptParts,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Kamu adalah HIGAYON, robot tutor matematika ramah untuk siswa SD kelas 3-6 di game MATH GRID ADVENTURE. Jawab dalam Bahasa Indonesia yang ceria, sederhana, jelas, maksimal 2-3 kalimat pendek, dan langsung membantu siswa memahami konsep geometri (persegi, persegi panjang, koordinat grid, bangun datar 2D, atau bangun ruang sederhana) tanpa membocorkan jawaban mentah begitu saja.',
        },
      });

      const text = response.text?.trim();
      if (text) {
        res.json({ explanation: text, source: 'gemini' });
        return;
      }
      res.json({ explanation: fallback, source: 'local' });
    } catch {
      res.json({ explanation: fallback, source: 'local' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Math Grid Adventure server listening on http://localhost:${PORT}`);
  });
}

startServer();
