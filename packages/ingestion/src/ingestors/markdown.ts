import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { storeDocumentsInQdrant } from '../storage/qdrant.js';
import { config } from '../config.js';
import matter from 'gray-matter';

export { ingestMarkdownFiles };
/**
 * Processes an Markdown file and returns an array of Document objects
 */
async function processMarkdownFile(filePath: string): Promise<Document[]> {
  // Read the Markdown file
  const content = await fs.readFile(filePath, 'utf8');

  // Extract frontmatter metadata using gray-matter
  const { data: metadata, content: markdownContent } = matter(content);

  // Create a text splitter
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  // Split the content into chunks
  const chunks = await textSplitter.splitText(markdownContent);

  // Convert chunks to Documents with metadata
  return chunks.map((chunk, i) => {
    return new Document({
      pageContent: chunk,
      metadata: {
        ...metadata,
        source: filePath,
        fileName: path.basename(filePath),
        chunkIndex: i,
        type: 'Markdown',
        createdAt: new Date().toISOString(),
      },
    });
  });
}

/**
 * Ingests all Markdown files from a directory
 */
async function ingestMarkdownFiles(directoryPath: string): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    // Find all Markdown files in the directory
    const mdxFiles = await glob('**/*.mdx', { cwd: directoryPath });

    if (mdxFiles.length === 0) {
      console.log('No Markdown files found in the specified directory.');
      return;
    }

    console.log(`Found ${mdxFiles.length} Markdown files to process.`);

    // Process all Markdown files
    let allDocuments: Document[] = [];
    for (const file of mdxFiles) {
      const filePath = path.join(directoryPath, file);
      console.log(`Processing Markdown file: ${filePath}`);

      const documents = await processMarkdownFile(filePath);
      allDocuments = [...allDocuments, ...documents];
    }

    console.log(`Created ${allDocuments.length} document chunks from Markdown files.`);

    console.log('Storing Markdown documents in Qdrant DB...');
    await storeDocumentsInQdrant(allDocuments, config.docsCollectionName);

    console.log('Markdown ingestion completed successfully!');
  } catch (error) {
    console.error('Error during Markdown ingestion:', error);
    throw error;
  }
}
