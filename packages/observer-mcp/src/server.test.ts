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
