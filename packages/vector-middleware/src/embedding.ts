import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from './config.js';

export { embeddings };

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: config.openaiApiKey,
  modelName: config.embeddingModel,
  batchSize: 50,
});
