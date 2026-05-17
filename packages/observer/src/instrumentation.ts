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
