import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { storeDocumentsInQdrant } from '../storage/qdrant.js';
import { config } from '../config.js';

export { ingestDiscordExports };

interface DiscordAuthor {
  id: string;
  name: string;
  discriminator: string;
  nickname: string;
  color: string | null;
  isBot: boolean;
  avatarUrl: string;
  roles?: Array<{
    id: string;
    name: string;
    color: string | null;
    position: number;
  }>;
}

interface DiscordReaction {
  emoji: {
    id: string;
    name: string;
    code: string;
    isAnimated: boolean;
    imageUrl: string;
  };
  count: number;
  users: DiscordAuthor[];
}

interface DiscordMessage {
  id: string;
  type: string;
  timestamp: string;
  timestampEdited: string | null;
  callEndedTimestamp: string | null;
  isPinned: boolean;
  content: string;
  author: DiscordAuthor;
  attachments: any[];
  embeds: any[];
  stickers: any[];
  reactions: DiscordReaction[];
  mentions: any[];
}

interface DiscordChannel {
  id: string;
  type: string;
  categoryId: string;
  category: string;
  name: string;
  topic: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  iconUrl: string;
}

interface DiscordExport {
  guild: DiscordGuild;
  channel: DiscordChannel;
  dateRange: {
    after: string | null;
    before: string | null;
  };
  exportedAt: string;
  messages: DiscordMessage[];
}

/**
 * Processes a Discord export JSON file and returns an array of Document objects
 */
async function processDiscordExport(filePath: string): Promise<Document[]> {
  // Read the Discord export file
  const content = await fs.readFile(filePath, 'utf8');
  const exportData: DiscordExport = JSON.parse(content);

  // Create a text splitter
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  const documents: Document[] = [];

  // Check if messages exist
  if (!exportData.messages || exportData.messages.length === 0) {
    console.log(`No messages found in file: ${filePath}`);
    return documents;
  }

  // Group messages by day to create logical conversation chunks
  const messagesByDay = groupMessagesByDay(exportData.messages);

  for (const [day, dayMessages] of Object.entries(messagesByDay)) {
    // Combine messages into a conversation format
    const conversationText = formatConversation(dayMessages, exportData.channel.name);

    // Split the conversation into chunks
    const chunks = await textSplitter.splitText(conversationText);

    // Convert chunks to Documents with metadata
    const dayDocuments = chunks.map((chunk, i) => {
      return new Document({
        pageContent: chunk,
        metadata: {
          source: filePath,
          fileName: path.basename(filePath),
          guildName: exportData.guild.name,
          guildId: exportData.guild.id,
          channelName: exportData.channel.name,
          channelId: exportData.channel.id,
          channelCategory: exportData.channel.category,
          day,
          chunkIndex: i,
          type: 'discord',
          messageCount: dayMessages.length,
          exportDate: exportData.exportedAt,
          createdAt: new Date().toISOString(),
        },
      });
    });

    documents.push(...dayDocuments);
  }

  return documents;
}

/**
 * Groups Discord messages by day
 */
function groupMessagesByDay(messages: DiscordMessage[]): Record<string, DiscordMessage[]> {
  const messagesByDay: Record<string, DiscordMessage[]> = {};

  for (const message of messages) {
    // Skip empty messages
    if (!message.content || !message.content.trim()) continue;

    // Get the day part of the timestamp (YYYY-MM-DD)
    // Handle both formats: "2021-11-17T19:40:32.542+04:00" and ISO format
    let day;
    try {
      day = message.timestamp.split('T')[0];
    } catch (error) {
      // If timestamp parsing fails, use current date as fallback
      console.warn(
        `Error: Failed to parse timestamp for message ${message.id}, using current date. ${error}`
      );
      day = new Date().toISOString().split('T')[0];
    }

    if (!messagesByDay[day]) {
      messagesByDay[day] = [];
    }

    messagesByDay[day].push(message);
  }

  return messagesByDay;
}

/**
 * Formats Discord messages into a conversation string
 */
function formatConversation(messages: DiscordMessage[], channelName: string): string {
  const formattedMessages = messages.map((msg) => {
    // Format timestamp, handling potential parsing errors
    let formattedTimestamp;
    try {
      formattedTimestamp = new Date(msg.timestamp).toLocaleString();
    } catch (error) {
      console.warn(`Error: ${error}`);
      formattedTimestamp = msg.timestamp || 'Unknown time';
    }

    // Format message with reactions if present
    let formattedContent = msg.content;

    // Add reaction information if present
    if (msg.reactions && msg.reactions.length > 0) {
      const reactionsText = msg.reactions
        .map((r) => `${r.emoji.name || r.emoji.code}(${r.count})`)
        .join(', ');
      formattedContent += `\n[Reactions: ${reactionsText}]`;
    }

    return `[${formattedTimestamp}] ${msg.author.name}: ${formattedContent}`;
  });

  return `Channel: ${channelName}\n\n${formattedMessages.join('\n\n')}`;
}

/**
 * Ingests all Discord export files from a directory
 */
async function ingestDiscordExports(directoryPath: string): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    // Find all JSON files in the directory
    const jsonFiles = await glob('**/*.json', { cwd: directoryPath });

    if (jsonFiles.length === 0) {
      console.log('No Discord export files found in the specified directory.');
      return;
    }

    console.log(`Found ${jsonFiles.length} Discord export files to process.`);

    // Process all Discord export files
    let allDocuments: Document[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(directoryPath, file);
      console.log(`Processing Discord export file: ${filePath}`);

      try {
        // Validate file content before processing
        const fileContent = await fs.readFile(filePath, 'utf8');
        let jsonData;

        try {
          jsonData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(`Invalid JSON in file ${filePath}:`, parseError);
          errorCount++;
          continue;
        }

        // Check if file has the expected structure
        if (!jsonData.guild || !jsonData.channel || !jsonData.messages) {
          console.error(`File ${filePath} does not have the expected Discord export structure`);
          errorCount++;
          continue;
        }

        const documents = await processDiscordExport(filePath);
        allDocuments = [...allDocuments, ...documents];
        processedCount++;
      } catch (error) {
        console.error(`Error processing Discord export file ${filePath}:`, error);
        errorCount++;
        // Continue with other files
      }
    }

    console.log(`Processed ${processedCount} files successfully (${errorCount} files failed)`);
    console.log(`Created ${allDocuments.length} document chunks from Discord exports.`);

    if (allDocuments.length === 0) {
      console.log(
        'No documents were created from Discord exports. Skipping embeddings generation.'
      );
      return;
    }
    // Store in Qdrant DB
    console.log('Storing Discord messages in Qdrant DB...');
    await storeDocumentsInQdrant(allDocuments, config.discordCollectionName);

    console.log('Discord export ingestion completed successfully!');
  } catch (error) {
    console.error('Error during Discord export ingestion:', error);
    throw error;
  }
}
