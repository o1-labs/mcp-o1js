import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

type SearchResult = {
  score: number;
  content: string;
}

const RATE_LIMIT = {
  perSecond: 1,
  perMonth: 15000,
};

let requestCount = {
  second: 0,
  month: 0,
  lastReset: Date.now(),
};

function checkRateLimit() {
  const now = Date.now();
  if (now - requestCount.lastReset > 1000) {
    requestCount.second = 0;
    requestCount.lastReset = now;
  }
  if (requestCount.second >= RATE_LIMIT.perSecond || requestCount.month >= RATE_LIMIT.perMonth) {
    throw new Error('Rate limit exceeded');
  }
  requestCount.second++;
  requestCount.month++;
}

const server = new McpServer(
  {
    name: 'mcp-o1js',
    version: '0.1.0',
    description: "MCP Server for o1js"
  });

server.tool(
  'search_discord',
  'Search for messages in o1js Discord chats related to the query',
  {
    query: z.string().describe('The search query for Discord messages.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    checkRateLimit();
    try {
      // console.log(`Tool search_discord called with query: "${query}", n_results: ${n_results}`);
      const results = await queryVectorDB([query], 'discord', n_results);
      // console.log(`Found ${results.length} results in Discord collection.`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in search_discord tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing search_discord: ${error.message}`,
          },
        ],
        error: {
          type: 'Error',
          message: error.message,
        },
      };
    }
  }
);

server.tool(
  'search_documentation',
  'Search for documentation in the o1js docs collection related to the query',
  {
    query: z.string().describe('The search query for documentation.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    checkRateLimit();
    try {
      // console.log(`Tool search_documentation called with query: "${query}", n_results: ${n_results}`);
      const results = await queryVectorDB([query], 'docs', n_results);
      // console.log(`Found ${results.length} results in Markdown collection.`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in search_documentation tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing search_documentation: ${error.message}`,
          },
        ],
        error: {
          type: 'Error',
          message: error.message,
        },
      };
    }
  }
);

server.tool(
  'search_o1js_codebase',
  'Search for code snippets in the o1js codebase related to the query',
  {
    query: z.string().describe('The search query for o1js codebase.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    checkRateLimit();
    try {
      // console.log(`Tool search_o1js_codebase called with query: "${query}", n_results: ${n_results}`);
      const results = await queryVectorDB([query], 'o1js', n_results);
      // console.log(`Found ${results.length} results in Markdown collection.`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in search_o1js_codebase tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing search_o1js_codebase: ${error.message}`,
          },
        ],
        error: {
          type: 'Error',
          message: error.message,
        },
      };
    }
  }
);


async function queryVectorDB(
  queryTexts: string[],
  source: string,
  nResults: number = 50
): Promise<SearchResult[]> {
  const queryParams = new URLSearchParams({
    query: queryTexts[0],
    nResults: nResults.toString(),
  });
  const response = await fetch(`http://localhost:3000/${source}?${queryParams}`);

  if (!response.ok) throw new Error(`Error: ${response.status}`);


  const raw = await response.json();
  let list = (raw as any).results;
  let structuredList: SearchResult[] = (list as any[]).map((e) => {
    return { score: e.score, content: e.content } as SearchResult;
  });
  let normalizedList = formatSearchResults(structuredList);
  return normalizedList;
}

function formatSearchResults(results: SearchResult[]): SearchResult[] {
  return results.map(result => ({
    ...result,
    content: formatContent(result.content)
  }));
}

function formatContent(content: string): string {
  let formatted = content.trim();

  formatted = formatted
    .replace(/\s*;\s*}/g, ';\n}')
    .replace(/{\s*/g, '{\n  ')
    .replace(/}\s*;/g, '\n};')
    .replace(/;(?!\s*[)}]|\s*$)/g, ';\n')
    .replace(/(function\s+\w+)/g, '\n$1')
    .replace(/(const\s+|let\s+)/g, '\n$1')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\n+/, '');

  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = 2;

  return lines
    .map(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return '';

      if (trimmedLine.includes('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmedLine;

      if (trimmedLine.includes('{')) {
        indentLevel++;
      }

      return indentedLine;
    })
    .join('\n');
}


async function main() {
  try {
    // Use stdio transport for communication
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  }
}

main();