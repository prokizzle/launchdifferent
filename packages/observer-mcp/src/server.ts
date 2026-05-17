import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ObserverDB } from '@launchdifferent/observer';
import { z } from 'zod';

export function createObserverMCPServer(dbPath: string): McpServer {
  const server = new McpServer({
    name: 'launchdifferent-observer',
    version: '0.1.0',
  });

  function withDB<T>(fn: (db: ObserverDB) => T): T {
    const db = new ObserverDB(dbPath);
    try {
      return fn(db);
    } finally {
      db.close();
    }
  }

  server.tool(
    'get_recent_errors',
    'Get the most recent errors from the Next.js dev server',
    { limit: z.number().min(1).max(100).default(10) },
    async ({ limit }) => {
      const errors = withDB((db) => db.getRecentErrors(limit));
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(errors, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'search_errors',
    'Search errors by message or stack trace content',
    {
      query: z
        .string()
        .describe('Search term to find in error messages or stack traces'),
    },
    async ({ query }) => {
      const errors = withDB((db) => db.searchErrors(query));
      return {
        content: [
          {
            type: 'text' as const,
            text:
              errors.length > 0
                ? JSON.stringify(errors, null, 2)
                : `No errors matching "${query}"`,
          },
        ],
      };
    }
  );

  server.tool(
    'get_error_detail',
    'Get full details of a specific error by ID including complete stack trace',
    {
      id: z
        .number()
        .describe('Error ID from get_recent_errors or search_errors'),
    },
    async ({ id }) => {
      const error = withDB((db) => db.getErrorById(id));
      return {
        content: [
          {
            type: 'text' as const,
            text: error
              ? JSON.stringify(error, null, 2)
              : `No error found with ID ${id}`,
          },
        ],
      };
    }
  );

  server.tool(
    'get_request_logs',
    'Get recent request logs from the Next.js dev server, optionally filtered by status code or path',
    {
      limit: z.number().min(1).max(100).default(20),
      status_code: z
        .number()
        .optional()
        .describe('Filter by HTTP status code such as 500 or 404'),
      path: z
        .string()
        .optional()
        .describe('Filter by request path using partial match'),
    },
    async ({ limit, status_code, path }) => {
      const logs = withDB((db) =>
        db.getRequestLogs({ limit, statusCode: status_code, path })
      );
      return {
        content: [
          {
            type: 'text' as const,
            text:
              logs.length > 0
                ? JSON.stringify(logs, null, 2)
                : 'No request logs found matching criteria',
          },
        ],
      };
    }
  );

  return server;
}
