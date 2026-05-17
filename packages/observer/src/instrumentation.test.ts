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
