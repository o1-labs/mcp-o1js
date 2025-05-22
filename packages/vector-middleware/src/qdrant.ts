import { QdrantVectorStore } from '@langchain/qdrant';
import { config } from './config.js';
import { embeddings } from './embedding.js';

export interface QueryResult {
  id: string | number;
  score: number;
  payload: Record<string, unknown>;
}

export async function vectorSearch(collection: string, vector: number[], limit: number) {
  const client = new QdrantVectorStore(embeddings, {
    url: `${config.qdrantServerURL}:${config.qdrantServerPort}`,
    apiKey: config.qdrantServerKey,
    collectionName: collection,
  });
  const response = await client.similaritySearchVectorWithScore(vector, limit);
  const structured_response = response.map((r: any) => ({
    score: r[1],
    content: r[0].pageContent ?? {},
  }));
  console.log(structured_response);
  return structured_response;
}
