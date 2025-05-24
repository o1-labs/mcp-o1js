#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
const server = new McpServer({
    name: 'mcp-o1js',
    version: '0.1.0',
    description: 'MCP Server for o1js',
});
server.tool('search_discord', 'Search for messages in o1js Discord chats related to the query', {
    query: z.string().describe('The search query for Discord messages.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
}, async ({ query, n_results }) => {
    try {
        const results = await queryVectorDB([query], 'discord', n_results);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
    catch (error) {
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
});
server.tool('search_documentation', 'Search for documentation in the o1js docs collection related to the query', {
    query: z.string().describe('The search query for documentation.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
}, async ({ query, n_results }) => {
    try {
        const results = await queryVectorDB([query], 'docs', n_results);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
    catch (error) {
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
});
server.tool('search_o1js_codebase', 'Search for code snippets in the o1js codebase related to the query', {
    query: z.string().describe('The search query for o1js codebase.'),
    n_results: z.number().optional().default(10).describe('Number of results to return.'),
}, async ({ query, n_results }) => {
    try {
        const results = await queryVectorDB([query], 'o1js', n_results);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
    catch (error) {
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
});
async function queryVectorDB(queryTexts, source, nResults = 50) {
    const queryParams = new URLSearchParams({
        query: queryTexts[0],
        nResults: nResults.toString(),
    });
    const response = await fetch(`https://mcp-o1js.onrender.com/${source}?${queryParams}`);
    if (!response.ok)
        throw new Error(`Error: ${response.status}`);
    const raw = await response.json();
    let list = raw.results;
    let structuredList = list.map((e) => {
        return { score: e.score, content: e.content };
    });
    let normalizedList = formatSearchResults(structuredList);
    return normalizedList;
}
function formatSearchResults(results) {
    return results.map((result) => ({
        ...result,
        content: formatContent(result.content),
    }));
}
function formatContent(content) {
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
        .map((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine)
            return '';
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
        const transport = new StdioServerTransport();
        await server.connect(transport);
    }
    catch (error) {
        console.error(`Fatal error in main(): ${error}`);
        process.exit(1);
    }
}
main();
