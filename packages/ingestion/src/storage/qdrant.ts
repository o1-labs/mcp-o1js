import { QdrantVectorStore } from '@langchain/qdrant';
import { config } from '../config.js';
import { Document } from 'langchain/document';
import { embeddings } from '../embeddings/openai.js';

export async function storeDocumentsInQdrant(
  documents: Document[],
  collectionName: string,
  batchSize: number = 50
): Promise<void> {
  if (documents.length === 0) return;

  const docs = documents.map((doc, i) => {
    return new Document({
      pageContent: documents[i].pageContent,
      metadata: documents[i].metadata,
    });
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: config.qdrantServerURL,
    collectionName: collectionName,
    apiKey: config.qdrantServerKey,
  });

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
  }
}
