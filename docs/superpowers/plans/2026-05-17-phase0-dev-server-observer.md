# Phase 0: Dev Server Observer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Claude Code real-time access to Next.js dev server errors and logs via an MCP server backed by SQLite.

**Architecture:** A Next.js app installs `@launchdifferent/observer` to capture errors/logs into a local SQLite database. A separate MCP server process reads that database and exposes query tools (`get_recent_errors`, `search_errors`, `get_error_detail`, `get_request_logs`). The two processes communicate only through the shared SQLite file — no sockets, no IPC.

**Tech Stack:** Node.js ≥22, TypeScript, better-sqlite3, @modelcontextprotocol/sdk, Zod, npm workspaces, Node native test runner (`node --test --experimental-strip-types`).

**Naming:** Package namespace is `@launchdifferent/*` per D013/D016. DB file lives at `.launchdifferent/observer.db`.

---

## File Structure

```
agile-brain/
├── package.json                    # workspace root
├── tsconfig.base.json              # shared TS config
├── .gitignore
├── packages/
│   ├── observer/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── db.ts               # SQLite schema + queries
│   │       ├── db.test.ts          # tests for db.ts
│   │       ├── instrumentation.ts  # Next.js instrumentation hook
│   │       ├── instrumentation.test.ts
│   │       ├── index.ts            # public exports
│   │       └── example-instrumentation.ts  # usage example for Next.js projects
│   └── observer-mcp/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── server.ts           # MCP server with 4 tools
│           ├── server.test.ts      # tests for MCP server
│           └── index.ts            # entry point (bin: observer-mcp)
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-05-17-phase0-dev-server-observer.md
```

**Boundaries:**
- `observer` depends only on `better-sqlite3`. It knows nothing about MCP.
- `observer-mcp` depends on `@launchdifferent/observer`, `@modelcontextprotocol/sdk`, and `zod`. It knows nothing about Next.js instrumentation API types — it only calls the DB.
- DB path is injected at construction time. No global config file.

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore` (first pass)
- Create: `packages/observer/package.json`
- Create: `packages/observer/tsconfig.json`
- Create: `packages/observer-mcp/package.json`
- Create: `packages/observer-mcp/tsconfig.json`

- [ ] **Step 1: Initialize git**

```bash
git init
```

Reason: Phase 0 is the only hand-built phase (D017). jj colocation (D008) will be adopted in Phase 1 when jj is available.

- [ ] **Step 2: Create workspace root `package.json`**

```json
{
  "name": "launchdifferent",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

- [ ] **Step 4: Create `packages/observer/package.json`**

```json
{
  "name": "@launchdifferent/observer",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "node --test --experimental-strip-types src/**/*.test.ts"
  },
  "dependencies": {
    "better-sqlite3": "^12.6.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 5: Create `packages/observer/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create `packages/observer-mcp/package.json`**

```json
{
  "name": "@launchdifferent/observer-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "observer-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "node --test --experimental-strip-types src/**/*.test.ts"
  },
  "dependencies": {
    "@launchdifferent/observer": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.12.1",
    "better-sqlite3": "^12.6.2",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 7: Create `packages/observer-mcp/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

- [ ] **Step 9: Verify workspace resolution**

```bash
npm ls --workspaces --depth=0
```

Expected: Shows `@launchdifferent/observer` and `@launchdifferent/observer-mcp` under root.

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.base.json packages/observer/package.json packages/observer/tsconfig.json packages/observer-mcp/package.json packages/observer-mcp/tsconfig.json
git commit -m "chore: scaffold monorepo with @launchdifferent/observer and @launchdifferent/observer-mcp packages"
```

---

### Task 2: SQLite Schema and Database Module

**Files:**
- Create: `packages/observer/src/db.ts`
- Create: `packages/observer/src/db.test.ts`

- [ ] **Step 1: Create the test file `packages/observer/src/db.test.ts`**

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ObserverDB } from './db.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('ObserverDB', () => {
  let dbPath: string;
  let db: ObserverDB;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `observer-test-${Date.now()}.db`);
    db = new ObserverDB(dbPath);
  });

  afterEach(() => {
    db.close();
    try { fs.unlinkSync(dbPath); } catch {}
  });

  it('creates tables on initialization', () => {
    const tables = db.listTables();
    assert.ok(tables.includes('errors'));
    assert.ok(tables.includes('request_logs'));
  });

  it('inserts and retrieves an error', () => {
    db.insertError({
      message: 'TypeError: cannot read property',
      stack: 'at foo.ts:10',
      digest: 'abc123',
      path: '/api/users',
      method: 'GET',
      routePath: '/app/api/users/route',
      routeType: 'route',
    });

    const errors = db.getRecentErrors(10);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'TypeError: cannot read property');
    assert.equal(errors[0].digest, 'abc123');
  });

  it('inserts and retrieves a request log', () => {
    db.insertRequestLog({
      path: '/api/users',
      method: 'POST',
      status_code: 201,
      duration_ms: 45,
      routePath: '/app/api/users/route',
      routeType: 'route',
    });

    const logs = db.getRequestLogs({ limit: 10 });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 201);
  });

  it('searches errors by message', () => {
    db.insertError({
      message: 'TypeError: cannot read property',
      stack: 'at foo.ts:10',
      digest: 'abc1',
      path: '/api/users',
      method: 'GET',
      routePath: '/app/api/users/route',
      routeType: 'route',
    });
    db.insertError({
      message: 'ReferenceError: x is not defined',
      stack: 'at bar.ts:20',
      digest: 'abc2',
      path: '/api/posts',
      method: 'GET',
      routePath: '/app/api/posts/route',
      routeType: 'route',
    });

    const results = db.searchErrors('TypeError');
    assert.equal(results.length, 1);
    assert.equal(results[0].digest, 'abc1');
  });

  it('gets error detail by id', () => {
    db.insertError({
      message: 'Test error',
      stack: 'full stack trace here',
      digest: 'xyz',
      path: '/test',
      method: 'GET',
      routePath: '/app/test/page',
      routeType: 'render',
    });

    const errors = db.getRecentErrors(1);
    const detail = db.getErrorById(errors[0].id);
    assert.ok(detail);
    assert.equal(detail!.stack, 'full stack trace here');
  });

  it('auto-prunes old entries beyond max count', () => {
    for (let i = 0; i < 15; i++) {
      db.insertError({
        message: `Error ${i}`,
        stack: `stack ${i}`,
        digest: `d${i}`,
        path: '/test',
        method: 'GET',
        routePath: '/app/test',
        routeType: 'render',
      });
    }

    db.prune(10);
    const all = db.getRecentErrors(100);
    assert.equal(all.length, 10);
    // Should keep the 10 most recent
    assert.equal(all[0].message, 'Error 14');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/observer && node --test --experimental-strip-types src/db.test.ts
```

Expected: FAIL — `Cannot find module './db.js'`

- [ ] **Step 3: Create the implementation `packages/observer/src/db.ts`**

```typescript
import Database from 'better-sqlite3';

export interface ErrorRecord {
  message: string;
  stack: string;
  digest: string;
  path: string;
  method: string;
  routePath: string;
  routeType: string;
}

export interface RequestLogRecord {
  path: string;
  method: string;
  status_code: number;
  duration_ms: number;
  routePath: string;
  routeType: string;
}

export interface StoredError extends ErrorRecord {
  id: number;
  timestamp: string;
}

export interface StoredRequestLog extends RequestLogRecord {
  id: number;
  timestamp: string;
}

export class ObserverDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        message TEXT NOT NULL,
        stack TEXT NOT NULL,
        digest TEXT NOT NULL,
        path TEXT NOT NULL,
        method TEXT NOT NULL,
        route_path TEXT NOT NULL,
        route_type TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS request_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        path TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        route_path TEXT NOT NULL,
        route_type TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_errors_message ON errors(message);
      CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status_code);
    `);
  }

  listTables(): string[] {
    const rows = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  insertError(record: ErrorRecord): void {
    this.db
      .prepare(
        `INSERT INTO errors (message, stack, digest, path, method, route_path, route_type)
         VALUES (@message, @stack, @digest, @path, @method, @routePath, @routeType)`
      )
      .run(record);
  }

  insertRequestLog(record: RequestLogRecord): void {
    this.db
      .prepare(
        `INSERT INTO request_logs (path, method, status_code, duration_ms, route_path, route_type)
         VALUES (@path, @method, @status_code, @duration_ms, @routePath, @routeType)`
      )
      .run(record);
  }

  getRecentErrors(limit: number): StoredError[] {
    return this.db
      .prepare(
        `SELECT id, timestamp, message, stack, digest, path, method,
                route_path AS routePath, route_type AS routeType
         FROM errors ORDER BY id DESC LIMIT ?`
      )
      .all(limit) as StoredError[];
  }

  getErrorById(id: number): StoredError | undefined {
    return this.db
      .prepare(
        `SELECT id, timestamp, message, stack, digest, path, method,
                route_path AS routePath, route_type AS routeType
         FROM errors WHERE id = ?`
      )
      .get(id) as StoredError | undefined;
  }

  searchErrors(query: string): StoredError[] {
    return this.db
      .prepare(
        `SELECT id, timestamp, message, stack, digest, path, method,
                route_path AS routePath, route_type AS routeType
         FROM errors
         WHERE message LIKE ? OR stack LIKE ?
         ORDER BY id DESC LIMIT 50`
      )
      .all(`%${query}%`, `%${query}%`) as StoredError[];
  }

  getRequestLogs(opts: {
    limit: number;
    statusCode?: number;
    path?: string;
  }): StoredRequestLog[] {
    let sql =
      `SELECT id, timestamp, path, method, status_code AS status_code_orig, duration_ms,
              route_path AS routePath, route_type AS routeType
       FROM request_logs WHERE 1=1`;
    const params: any[] = [];

    if (opts.statusCode !== undefined) {
      sql += ' AND status_code = ?';
      params.push(opts.statusCode);
    }
    if (opts.path !== undefined) {
      sql += ' AND path LIKE ?';
      params.push(`%${opts.path}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(opts.limit);

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      path: r.path,
      method: r.method,
      status_code: r.status_code_orig,
      duration_ms: r.duration_ms,
      routePath: r.routePath,
      routeType: r.routeType,
    }));
  }

  prune(maxEntries: number): void {
    this.db
      .prepare(
        'DELETE FROM errors WHERE id NOT IN (SELECT id FROM errors ORDER BY id DESC LIMIT ?)'
      )
      .run(maxEntries);
    this.db
      .prepare(
        'DELETE FROM request_logs WHERE id NOT IN (SELECT id FROM request_logs ORDER BY id DESC LIMIT ?)'
      )
      .run(maxEntries);
  }

  close(): void {
    this.db.close();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/observer && node --test --experimental-strip-types src/db.test.ts
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/observer/src/db.ts packages/observer/src/db.test.ts
git commit -m "feat(observer): add SQLite database module with error and request_log tables"
```

---

### Task 3: Next.js Instrumentation Hook

**Files:**
- Create: `packages/observer/src/instrumentation.ts`
- Create: `packages/observer/src/index.ts`
- Create: `packages/observer/src/instrumentation.test.ts`

- [ ] **Step 1: Create the test file `packages/observer/src/instrumentation.test.ts`**

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createObserverInstrumentation } from './instrumentation.js';
import { ObserverDB } from './db.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('createObserverInstrumentation', () => {
  let dbPath: string;
  let db: ObserverDB;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `observer-instr-test-${Date.now()}.db`);
    db = new ObserverDB(dbPath);
  });

  afterEach(() => {
    db.close();
    try { fs.unlinkSync(dbPath); } catch {}
  });

  it('onRequestError logs errors to db', async () => {
    const { onRequestError } = createObserverInstrumentation({ dbPath });

    await onRequestError(
      Object.assign(new Error('Something broke'), { digest: 'err123' }),
      { path: '/api/users', method: 'GET', headers: {} },
      {
        routerKind: 'App Router' as const,
        routePath: '/app/api/users/route',
        routeType: 'route' as const,
        renderSource: 'react-server-components' as const,
        revalidateReason: undefined,
        renderType: 'dynamic' as const,
      }
    );

    const errors = db.getRecentErrors(10);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Something broke');
    assert.equal(errors[0].digest, 'err123');
    assert.equal(errors[0].routeType, 'route');
  });

  it('uses provided db path', () => {
    const { onRequestError } = createObserverInstrumentation({ dbPath });
    assert.ok(typeof onRequestError === 'function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/observer && node --test --experimental-strip-types src/instrumentation.test.ts
```

Expected: FAIL — `Cannot find module './instrumentation.js'`

- [ ] **Step 3: Create `packages/observer/src/instrumentation.ts`**

```typescript
import { ObserverDB } from './db.js';

export interface ObserverOptions {
  dbPath?: string;
}

const DEFAULT_DB_PATH = '.launchdifferent/observer.db';

export function createObserverInstrumentation(options: ObserverOptions = {}) {
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  let db: ObserverDB | null = null;

  function getDB(): ObserverDB {
    if (!db) {
      db = new ObserverDB(dbPath);
    }
    return db;
  }

  async function onRequestError(
    error: { digest: string } & Error,
    request: {
      path: string;
      method: string;
      headers: { [key: string]: string | string[] };
    },
    context: {
      routerKind: 'Pages Router' | 'App Router';
      routePath: string;
      routeType: 'render' | 'route' | 'action' | 'proxy';
      renderSource:
        | 'react-server-components'
        | 'react-server-components-payload'
        | 'server-rendering';
      revalidateReason: 'on-demand' | 'stale' | undefined;
      renderType: 'dynamic' | 'dynamic-resume';
    }
  ): Promise<void> {
    getDB().insertError({
      message: error.message,
      stack: error.stack ?? '',
      digest: error.digest ?? '',
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    });
  }

  return { onRequestError };
}
```

- [ ] **Step 4: Create `packages/observer/src/index.ts`** (public API surface)

```typescript
export { ObserverDB } from './db.js';
export type {
  ErrorRecord,
  RequestLogRecord,
  StoredError,
  StoredRequestLog,
} from './db.js';
export { createObserverInstrumentation } from './instrumentation.js';
export type { ObserverOptions } from './instrumentation.js';
```

- [ ] **Step 5: Run instrumentation tests to verify they pass**

```bash
cd packages/observer && node --test --experimental-strip-types src/instrumentation.test.ts
```

Expected: All 2 tests PASS

- [ ] **Step 6: Also verify the full observer test suite**

```bash
cd packages/observer && node --test --experimental-strip-types src/**/*.test.ts
```

Expected: All 8 tests PASS (6 from Task 2 + 2 from Task 3)

- [ ] **Step 7: Commit**

```bash
git add packages/observer/src/instrumentation.ts packages/observer/src/index.ts packages/observer/src/instrumentation.test.ts
git commit -m "feat(observer): add Next.js instrumentation hook with onRequestError"
```

---

### Task 4: MCP Server

**Files:**
- Create: `packages/observer-mcp/src/server.ts`
- Create: `packages/observer-mcp/src/index.ts`
- Create: `packages/observer-mcp/src/server.test.ts`

- [ ] **Step 1: Create the test file `packages/observer-mcp/src/server.test.ts`**

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createObserverMCPServer } from './server.js';
import { ObserverDB } from '@launchdifferent/observer';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Observer MCP Server', () => {
  let dbPath: string;
  let db: ObserverDB;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `observer-mcp-test-${Date.now()}.db`);
    db = new ObserverDB(dbPath);
  });

  afterEach(() => {
    db.close();
    try { fs.unlinkSync(dbPath); } catch {}
  });

  it('creates server instance', () => {
    const server = createObserverMCPServer(dbPath);
    assert.ok(server);
  });

  it('db layer supports the queries the MCP tools need', () => {
    db.insertError({
      message: 'Test error',
      stack: 'stack trace',
      digest: 'abc',
      path: '/api/test',
      method: 'GET',
      routePath: '/app/api/test/route',
      routeType: 'route',
    });

    const errors = db.getRecentErrors(10);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Test error');

    const detail = db.getErrorById(errors[0].id);
    assert.ok(detail);
    assert.equal(detail!.stack, 'stack trace');
  });

  it('db layer supports search queries', () => {
    db.insertError({
      message: 'TypeError: null ref',
      stack: 'at component.tsx:5',
      digest: 'e1',
      path: '/dashboard',
      method: 'GET',
      routePath: '/app/dashboard/page',
      routeType: 'render',
    });
    db.insertError({
      message: 'SyntaxError: unexpected token',
      stack: 'at parser.ts:10',
      digest: 'e2',
      path: '/api/parse',
      method: 'POST',
      routePath: '/app/api/parse/route',
      routeType: 'route',
    });

    const results = db.searchErrors('TypeError');
    assert.equal(results.length, 1);
    assert.equal(results[0].digest, 'e1');
  });

  it('db layer supports request log queries with status filter', () => {
    db.insertRequestLog({
      path: '/api/users',
      method: 'GET',
      status_code: 500,
      duration_ms: 120,
      routePath: '/app/api/users/route',
      routeType: 'route',
    });
    db.insertRequestLog({
      path: '/api/posts',
      method: 'GET',
      status_code: 200,
      duration_ms: 30,
      routePath: '/app/api/posts/route',
      routeType: 'route',
    });

    const serverErrors = db.getRequestLogs({ limit: 10, statusCode: 500 });
    assert.equal(serverErrors.length, 1);
    assert.equal(serverErrors[0].path, '/api/users');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/observer-mcp && node --test --experimental-strip-types src/server.test.ts
```

Expected: FAIL — `Cannot find module './server.js'`

- [ ] **Step 3: Create `packages/observer-mcp/src/server.ts`**

```typescript
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
```

- [ ] **Step 4: Create `packages/observer-mcp/src/index.ts`** (entry point)

```typescript
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createObserverMCPServer } from './server.js';

const dbPath = process.argv[2] ?? '.launchdifferent/observer.db';

const server = createObserverMCPServer(dbPath);
const transport = new StdioServerTransport();

await server.connect(transport);
console.error(`Observer MCP Server running on stdio (db: ${dbPath})`);
```

- [ ] **Step 5: Run MCP server tests to verify they pass**

```bash
cd packages/observer-mcp && node --test --experimental-strip-types src/server.test.ts
```

Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/observer-mcp/src/server.ts packages/observer-mcp/src/index.ts packages/observer-mcp/src/server.test.ts
git commit -m "feat(observer-mcp): add MCP server with get_recent_errors, search_errors, get_error_detail, get_request_logs tools"
```

---

### Task 5: Finishing Touches

**Files:**
- Modify: `.gitignore` (update to final version)
- Create: `packages/observer/src/example-instrumentation.ts`

- [ ] **Step 1: Update `.gitignore`**

```
node_modules/
dist/
*.db
firebase-debug.log
.launchdifferent/
```

- [ ] **Step 2: Create `packages/observer/src/example-instrumentation.ts`**

```typescript
// Example: copy this pattern into your Next.js project's instrumentation.ts
//
// import { createObserverInstrumentation } from '@launchdifferent/observer';
//
// const observer = createObserverInstrumentation({
//   dbPath: '.launchdifferent/observer.db',
// });
//
// export const onRequestError = observer.onRequestError;
//
// Then ensure your next.config.ts has:
//   experimental: { instrumentationHook: true }
```

- [ ] **Step 3: Run the full test suite across all packages**

```bash
cd /home/prokizzle/repos/agile-brain && node --test --experimental-strip-types packages/observer/src/**/*.test.ts && node --test --experimental-strip-types packages/observer-mcp/src/**/*.test.ts
```

Expected: All tests across both packages PASS (6 + 2 + 4 = 12 tests)

- [ ] **Step 4: Commit**

```bash
git add .gitignore packages/observer/src/example-instrumentation.ts
git commit -m "chore: add final .gitignore and example instrumentation usage"
```

---

## Summary

| Task | What it builds | Files | Tests |
|------|---------------|-------|-------|
| 1 | Monorepo scaffolding | 7 config files | None |
| 2 | SQLite schema + DB module | `db.ts` | 6 tests |
| 3 | Next.js instrumentation hook | `instrumentation.ts`, `index.ts` | 2 tests |
| 4 | MCP server with 4 tools | `server.ts`, `index.ts` | 4 tests |
| 5 | Finishing touches | `.gitignore`, example | Full suite re-run |

**MCP Tools provided:**
- `get_recent_errors` — latest N errors with message, path, route info
- `search_errors` — text search across error messages and stack traces
- `get_error_detail` — complete error with full stack trace by ID
- `get_request_logs` — recent requests, filterable by status code and path

**Total: 12 tests across 3 test files, 5 commits.**

**Claude Code MCP config** (after install, add to `.claude/settings.json`):

```json
{
  "mcpServers": {
    "launchdifferent-observer": {
      "command": "node",
      "args": [
        "--experimental-strip-types",
        "packages/observer-mcp/src/index.ts",
        ".launchdifferent/observer.db"
      ]
    }
  }
}
```
