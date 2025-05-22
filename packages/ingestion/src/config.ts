// File: src/config.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Validate that required environment variables are set
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "QDRANT_SERVER_URL",
  "QDRANT_SERVER_PORT",
  "QDRANT_SERVER_KEY",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",

  qdrantServerURL: process.env.QDRANT_SERVER_URL || "http://localhost",
  qdrantServerPort: process.env.QDRANT_SERVER_PORT || "8000",
  qdrantServerKey: process.env.QDRANT_SERVER_KEY || "",

  docsCollectionName: process.env.DOCS_COLLECTION_NAME || "docs2_documents",
  discordCollectionName:
    process.env.DISCORD_COLLECTION_NAME || "discord_messages",
  o1jsCollectionName: process.env.O1JS_COLLECTION_NAME || "o1js_codebase",

  docsFolderPath:
    process.env.DOCS_FOLDER_PATH || path.join(process.cwd(), "data", "mdx"),
  discordFolderPath:
    process.env.DISCORD_FOLDER_PATH ||
    path.join(process.cwd(), "data", "discord"),
  o1jsFolderPath:
    process.env.O1JS_FOLDER_PATH ||
    path.join(process.cwd(), "data", "typescript"),

  localEmbeddingsPath:
    process.env.LOCAL_EMBEDDINGS_PATH ||
    path.join(process.cwd(), "data", "embeddings"),

  chunkSize: parseInt(process.env.CHUNK_SIZE || "1000", 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200", 10),

  tsChunkSize: parseInt(process.env.TS_CHUNK_SIZE || "500", 10),
  tsChunkOverlap: parseInt(process.env.TS_CHUNK_OVERLAP || "100", 10),
  tsMaxFileSize: parseInt(process.env.TS_MAX_FILE_SIZE || "500000", 10), // 500KB
  tsIgnoredFolders: (
    process.env.TS_IGNORED_FOLDERS || "node_modules,dist,build,.git,coverage"
  ).split(","),
};
