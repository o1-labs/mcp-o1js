#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const gatewayArgIndex = process.argv.findIndex(arg => arg === '-g' || arg === '--gateway-url');
if (gatewayArgIndex === -1 || !process.argv[gatewayArgIndex + 1]) {
  console.error('Error: Gateway URL is required. Please provide it using -g or --gateway-url');
  process.exit(1);
}

const gatewayURL = process.argv[gatewayArgIndex + 1];

type SearchResult = {
  score: number;
  content: string;
};

const server = new McpServer({
  name: 'mcp-o1js',
  version: '0.0.3',
  description: 'MCP Server for o1js',
});

server.tool(
  'search_discord',
  'Search for messages in o1js Discord chats related to the query. This tool is not a reliable source of information, but it can be useful for finding answers to questions that are not covered in the documentation or codebase.',
  {
    query: z.string().describe('The search query for Discord messages.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    try {
      const results = await queryVectorDB([query], 'discord', n_results);
      const processedResults = processSearchResults(results);
      return {
        content: [
          {
            type: 'text',
            text: processedResults,
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
  'Search for documentation in the o1js docs collection related to the query. Use this tool to find answers to questions about o1js that are covered in the documentation.',
  {
    query: z.string().describe('The search query for documentation.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    try {
      const results = await queryVectorDB([query], 'docs', n_results);
      const processedResults = processSearchResults(results);
      return {
        content: [
          {
            type: 'text',
            text: processedResults,
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
  'Search for code snippets in the o1js codebase related to the query. Use this tool to find code examples, functions, or classes that are relevant to your query.',
  {
    query: z.string().describe('The search query for o1js codebase.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
  },
  async ({ query, n_results }) => {
    try {
      const results = await queryVectorDB([query], 'o1js', n_results);
      const processedResults = processSearchResults(results);
      return {
        content: [
          {
            type: 'text',
            text: processedResults,
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
  nResults: number = 10
): Promise<SearchResult[]> {
  const queryParams = new URLSearchParams({
    query: queryTexts[0],
    nResults: nResults.toString(),
  });
  const response = await fetch(`${gatewayURL}/${source}?${queryParams}`);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  const raw = await response.json();
  return raw.results;
}

function processSearchResults(searchResults: SearchResult[]): string {
    const formattedItems = searchResults.map(result => {
        const cleanedContent = result.content;
        return `SIMILARITY: ${result.score} ${cleanedContent}`;
    });
    return formattedItems.join('\n\n');
}

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  }
}

main();
