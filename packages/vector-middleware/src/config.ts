import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['OPENAI_API_KEY', 'QDRANT_SERVER_URL', 'QDRANT_SERVER_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',

  qdrantServerURL: process.env.QDRANT_SERVER_URL || 'http://localhost',
  qdrantServerPort: process.env.QDRANT_SERVER_PORT || '8000',
  qdrantServerKey: process.env.QDRANT_SERVER_KEY || '0000',

  docsCollectionName: process.env.DOCS_COLLECTION_NAME || 'docs2_documents',
  discordCollectionName: process.env.DISCORD_COLLECTION_NAME || 'discord_messages',
  o1jsCollectionName: process.env.O1JS_COLLECTION_NAME || 'o1js_codebase',

  windowAsMs: process.env.WINDOW_AS_MS ? parseInt(process.env.WINDOW_AS_MS) : 60000,
  maxRequestsPerWindow: process.env.MAX_REQUESTS_PER_WINDOW ? parseInt(process.env.MAX_REQUESTS_PER_WINDOW) : 10,

};
