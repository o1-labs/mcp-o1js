import express from 'express';
import { globalLimiter } from './ratelimit.js';
import { embeddings } from './embedding.js';
import { vectorSearch } from './qdrant.js';
import { config } from './config.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(globalLimiter);

type SearchResult = {
  score: number;
  content: string;
}

/**
 * Generic handler factory for the three endpoints.
 */
function createHandler(collection: string) {
  return async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const query = req.query.query as string | undefined;
      const nResults = parseInt((req.query.nResults as string | undefined) ?? '10', 10);

      if (!query) {
        res.status(400).json({ error: "Missing 'query' parameter" });
        return;
      }

      const vector = await embeddings.embedQuery(query);
      const results: SearchResult[] = await vectorSearch(collection, vector, nResults);

      res.json({ results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

app.get('/discord', createHandler(config.discordCollectionName));
app.get('/docs', createHandler(config.docsCollectionName));
app.get('/o1js', createHandler(config.o1jsCollectionName));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`REST API listening on :${PORT}`);
});

// ===========================
// Usage (minimal)
// ===========================
// 1. Install dependencies:
//      npm install
// 2. Configure environment variables (example .env):
//      QDRANT_URL=http://localhost:6333
//      QDRANT_API_KEY=<key if needed>
// 3. Run in dev mode:
//      npm run dev
// 4. Example request:
//      curl "http://localhost:3000/discord?query=search%20text&nResults=5"
// ===========================
