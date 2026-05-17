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
      `SELECT id, timestamp, path, method, status_code, duration_ms,
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

    return this.db.prepare(sql).all(...params) as StoredRequestLog[];
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
