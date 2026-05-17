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
