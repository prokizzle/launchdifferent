#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createObserverMCPServer } from './server.js';

const dbPath = process.argv[2] ?? '.launchdifferent/observer.db';

const server = createObserverMCPServer(dbPath);
const transport = new StdioServerTransport();

await server.connect(transport);
console.error(`Observer MCP Server running on stdio (db: ${dbPath})`);
