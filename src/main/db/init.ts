import { sqliteCacheService } from 'prana/main/services/sqliteCacheService'
import * as schema from './schema'

const DB_NAME = 'chakra-cache.sqlite'

let isInitialized = false

export const initDb = () => {
  const db = sqliteCacheService.initCache(DB_NAME, schema)

  const ddl = `
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT,
      clone_url TEXT,
      commit_hash TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_users (
      employee_id TEXT,
      app_id TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL,
      PRIMARY KEY (employee_id, app_id)
    );

    CREATE TABLE IF NOT EXISTS app_teams (
      app_id TEXT,
      team_id TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL,
      PRIMARY KEY (app_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_keys (
      short_key TEXT PRIMARY KEY,
      full_description TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS configs (
      id TEXT PRIMARY KEY,
      key TEXT,
      value TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS designations (
      id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_teams (
      employee_id TEXT,
      team_id TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL,
      PRIMARY KEY (employee_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      password_hash TEXT,
      otp_hash TEXT,
      otp_expiry INTEGER,
      role TEXT,
      department_id TEXT,
      designation_id TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS holidays (
      date TEXT PRIMARY KEY,
      holiday_name TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leaves (
      leave_type TEXT PRIMARY KEY,
      count INTEGER,
      carry_forward INTEGER,
      max_forward INTEGER,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      sync INTEGER,
      is_dirty INTEGER DEFAULT 0 NOT NULL,
      is_deleted INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_auth (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS installed_apps (
      app_id TEXT PRIMARY KEY,
      installed_at INTEGER,
      install_path TEXT
    );
  `

  sqliteCacheService.executeRawSql(DB_NAME, ddl)
  isInitialized = true
  return db
}

export const getDb = () => {
  if (!isInitialized) {
    return initDb()
  }
  return sqliteCacheService.initCache(DB_NAME, schema)
}

export const resetDbInitialization = () => {
  isInitialized = false
  // Prana exposes closeCache if needed, but since we overwrite the root path,
  // we just need to ensure executeRawSql gets run again on the new cache instance.
}
