import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

async function main() {
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
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.tool(
    'search_discord',
    {
      query: z.string().describe('The search query for Discord messages.'),
      n_results: z.number().optional().default(50).describe('Number of results to return.'),
    },
    async ({ query, n_results }) => {
      checkRateLimit();
      try {
        console.log(`Tool search_discord called with query: "${query}", n_results: ${n_results}`);
        const results = await queryVectorDB([query], 'discord', n_results);
        console.log(`Found ${results.length} results in Discord collection.`);
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
    {
      query: z.string().describe('The search query for documentation.'),
      n_results: z.number().optional().default(50).describe('Number of results to return.'),
    },
    async ({ query, n_results }) => {
      checkRateLimit();
      try {
        console.log(
          `Tool search_documentation called with query: "${query}", n_results: ${n_results}`
        );
        const results = await queryVectorDB([query], 'docs', n_results);
        console.log(`Found ${results.length} results in Markdown collection.`);
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
    {
      query: z.string().describe('The search query for o1js codebase.'),
      n_results: z.number().optional().default(50).describe('Number of results to return.'),
    },
    async ({ query, n_results }) => {
      checkRateLimit();
      try {
        console.log(
          `Tool search_o1js_codebase called with query: "${query}", n_results: ${n_results}`
        );
        const results = await queryVectorDB([query], 'o1js', n_results);
        console.log(`Found ${results.length} results in Markdown collection.`);
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function queryVectorDB(
  queryTexts: string[],
  source: string,
  nResults: number = 50
): Promise<any> {
  const queryParams = new URLSearchParams({
    query: queryTexts[0],
    nResults: nResults.toString(),
  });
  const response = await fetch(`http://localhost:3000/${source}?${queryParams}`);

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const responseData = await response.json();
  console.log(`Response: ${responseData}`);
  return responseData;
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
