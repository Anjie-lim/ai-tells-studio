import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface PlayerScoreRecord {
  id: string;
  playerName: string;
  playerEmail: string;
  gameTitle: string;
  score: number;
  accuracy: number;
  totalTells: number;
  foundTells: number;
  hintsUsed: number;
  timeElapsedSeconds: number;
  completedAt: string;
  foundDetails: Array<{
    title: string;
    category: string;
    points: number;
  }>;
}

// In-memory score store with seed demo records
const recordedScores: PlayerScoreRecord[] = [
  {
    id: 'rec-demo-1',
    playerName: 'Alex Vance',
    playerEmail: 'alex.vance@example.com',
    gameTitle: 'AI Artifact Detective Challenge',
    score: 200,
    accuracy: 100,
    totalTells: 2,
    foundTells: 2,
    hintsUsed: 0,
    timeElapsedSeconds: 38,
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    foundDetails: [
      { title: 'Mismatched Glasses Frame', category: 'Anatomy / Objects', points: 100 },
      { title: 'Extra 6th Finger', category: 'Anatomy', points: 100 }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // CORS headers for standalone exported HTML files played anywhere
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all recorded scores
  app.get('/api/scores', (req, res) => {
    res.json({
      success: true,
      count: recordedScores.length,
      scores: [...recordedScores].reverse()
    });
  });

  // Record a score from app or standalone HTML export
  app.post('/api/record-score', async (req, res) => {
    try {
      const {
        playerName,
        playerEmail,
        gameTitle,
        score,
        accuracy,
        totalTells,
        foundTells,
        hintsUsed,
        timeElapsedSeconds,
        foundDetails,
        sheetsWebhookUrl
      } = req.body;

      if (!playerName || !playerEmail) {
        return res.status(400).json({ error: 'Player name and email are required' });
      }

      const record: PlayerScoreRecord = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        playerName: String(playerName).trim(),
        playerEmail: String(playerEmail).trim(),
        gameTitle: gameTitle || 'AI Artifact Detective Challenge',
        score: Number(score) || 0,
        accuracy: Number(accuracy) || 0,
        totalTells: Number(totalTells) || 0,
        foundTells: Number(foundTells) || 0,
        hintsUsed: Number(hintsUsed) || 0,
        timeElapsedSeconds: Number(timeElapsedSeconds) || 0,
        completedAt: new Date().toISOString(),
        foundDetails: Array.isArray(foundDetails) ? foundDetails : []
      };

      recordedScores.push(record);

      // If Google Sheets webhook is configured, also forward to Sheets asynchronously
      let sheetsForwardStatus = 'skipped';
      if (sheetsWebhookUrl && typeof sheetsWebhookUrl === 'string' && sheetsWebhookUrl.startsWith('http')) {
        try {
          const response = await fetch(sheetsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: record.completedAt,
              playerName: record.playerName,
              playerEmail: record.playerEmail,
              gameTitle: record.gameTitle,
              score: record.score,
              accuracyPercent: record.accuracy + '%',
              foundTells: `${record.foundTells}/${record.totalTells}`,
              hintsUsed: record.hintsUsed,
              timeElapsedSec: record.timeElapsedSeconds,
              detectedTells: record.foundDetails.map(f => f.title).join(', ')
            })
          });
          sheetsForwardStatus = response.ok ? 'forwarded_to_sheets' : 'sheets_forward_failed';
        } catch (forwardErr) {
          console.error('Error forwarding to Google Sheets webhook:', forwardErr);
          sheetsForwardStatus = 'sheets_forward_network_error';
        }
      }

      res.json({
        success: true,
        message: 'Score recorded successfully',
        record,
        sheetsStatus: sheetsForwardStatus
      });
    } catch (err: any) {
      console.error('Failed to record score:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Delete / clear scores
  app.delete('/api/scores', (req, res) => {
    recordedScores.length = 0;
    res.json({ success: true, message: 'All scores cleared' });
  });

  app.delete('/api/scores/:id', (req, res) => {
    const idx = recordedScores.findIndex(s => s.id === req.params.id);
    if (idx !== -1) {
      recordedScores.splice(idx, 1);
      res.json({ success: true, message: 'Record deleted' });
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  });

  // Proxy test for Google Sheets Webhook to avoid browser CORS restrictions
  app.post('/api/test-sheets-webhook', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'Valid URL is required' });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTest: true,
          timestamp: new Date().toISOString(),
          playerName: 'Test Player (AI Tell Studio)',
          playerEmail: 'test@example.com',
          gameTitle: 'Connection Test',
          score: 100,
          accuracyPercent: '100%',
          foundTells: '1/1',
          hintsUsed: 0,
          timeElapsedSec: 15,
          detectedTells: 'Test Verification Ping'
        })
      });

      const responseText = await response.text();
      res.json({
        success: response.ok,
        status: response.status,
        response: responseText.slice(0, 300)
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to connect to Google Sheets webhook'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Tell Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
