// Local-first data store with optional Google Apps Script sync.
// Reads/writes are immediate via localStorage; if APPS_SCRIPT_URL is set,
// mutations are mirrored to the Sheet in the background and on app load.

import { useEffect, useState, useSyncExternalStore } from "react";

export const SHEETS = [
  "Users","Planning_Cycles","Values","Monthly_Goals","Weekly_Plans","Daily_Plans",
  "Tasks","Habits","Habit_Logs","Beliefs","Mindset","Influences","Inner_Seasons",
  "Daily_Reviews","Weekly_Reviews","Monthly_Reviews","Reminders","Settings",
] as const;

export type SheetName = typeof SHEETS[number];
export type Row = Record<string, any> & { [key: string]: any };

const STORAGE_KEY = "hayatk_db_v1";
const URL_KEY = "hayatk_apps_url";
const USER_KEY = "hayatk_user_id";

type DB = Record<SheetName, Row[]>;

function emptyDB(): DB {
  const db = {} as DB;
  SHEETS.forEach(s => (db[s] = []));
  return db;
}

function readDB(): DB {
  if (typeof window === "undefined") return emptyDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw);
    const db = emptyDB();
    SHEETS.forEach(s => { db[s] = Array.isArray(parsed[s]) ? parsed[s] : []; });
    return db;
  } catch {
    return emptyDB();
  }
}

function writeDB(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// reactive subscription
const listeners = new Set<() => void>();
let _db: DB | null = null;

function getDB(): DB {
  if (_db === null) _db = readDB();
  return _db;
}

function emit() {
  listeners.forEach(l => l());
}

function commit(next: DB) {
  _db = next;
  writeDB(next);
  emit();
}

export function getAppsScriptUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(URL_KEY) || "";
}

export function setAppsScriptUrl(url: string) {
  localStorage.setItem(URL_KEY, url);
  emit();
}

export function getUserId(): string {
  if (typeof window === "undefined") return "local-user";
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

function nowISO() { return new Date().toISOString(); }

// ----- Sync to Apps Script -----
async function syncToSheet(action: "create" | "update" | "delete", sheet: SheetName, payload: any, id?: string) {
  const url = getAppsScriptUrl();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      // text/plain avoids CORS preflight against Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, sheet, payload, id }),
    });
  } catch (e) {
    console.warn("sync failed (will retry later)", e);
  }
}

// ----- Public API -----
export function list<T = Row>(sheet: SheetName, filter?: Partial<Row>): T[] {
  const rows = getDB()[sheet] || [];
  if (!filter) return rows as T[];
  return rows.filter(r =>
    Object.entries(filter).every(([k, v]) => String(r[k] ?? "") === String(v ?? ""))
  ) as T[];
}

export function get<T = Row>(sheet: SheetName, id: string): T | undefined {
  const idKey = primaryKey(sheet);
  return getDB()[sheet].find(r => r[idKey] === id) as T | undefined;
}

export function primaryKey(sheet: SheetName): string {
  const map: Record<SheetName, string> = {
    Users: "user_id", Planning_Cycles: "cycle_id", Values: "value_id",
    Monthly_Goals: "goal_id", Weekly_Plans: "week_id", Daily_Plans: "daily_plan_id",
    Tasks: "task_id", Habits: "habit_id", Habit_Logs: "log_id", Beliefs: "belief_id",
    Mindset: "mindset_id", Influences: "influence_id", Inner_Seasons: "season_id",
    Daily_Reviews: "review_id", Weekly_Reviews: "weekly_review_id",
    Monthly_Reviews: "monthly_review_id", Reminders: "reminder_id", Settings: "setting_id",
  };
  return map[sheet];
}

export function create<T extends Row>(sheet: SheetName, data: Partial<T>): T {
  const idKey = primaryKey(sheet);
  const row: Row = {
    ...data,
    [idKey]: data[idKey] || uid(),
    user_id: data.user_id || getUserId(),
    created_at: data.created_at || nowISO(),
  };
  if ("updated_at" in (data as any) || true) row.updated_at = nowISO();
  const db = getDB();
  commit({ ...db, [sheet]: [...db[sheet], row] });
  syncToSheet("create", sheet, row);
  return row as T;
}

export function update<T extends Row>(sheet: SheetName, id: string, patch: Partial<T>): T | undefined {
  const idKey = primaryKey(sheet);
  const db = getDB();
  let updated: Row | undefined;
  const next = db[sheet].map(r => {
    if (r[idKey] === id) {
      updated = { ...r, ...patch, updated_at: nowISO() };
      return updated;
    }
    return r;
  });
  commit({ ...db, [sheet]: next });
  if (updated) syncToSheet("update", sheet, patch, id);
  return updated as T | undefined;
}

export function remove(sheet: SheetName, id: string) {
  const idKey = primaryKey(sheet);
  const db = getDB();
  commit({ ...db, [sheet]: db[sheet].filter(r => r[idKey] !== id) });
  syncToSheet("delete", sheet, null, id);
}

export function bulkCreate<T extends Row>(sheet: SheetName, items: Partial<T>[]): T[] {
  const idKey = primaryKey(sheet);
  const stamped = items.map(d => ({
    ...d,
    [idKey]: d[idKey] || uid(),
    user_id: d.user_id || getUserId(),
    created_at: d.created_at || nowISO(),
    updated_at: nowISO(),
  })) as Row[];
  const db = getDB();
  commit({ ...db, [sheet]: [...db[sheet], ...stamped] });
  stamped.forEach(r => syncToSheet("create", sheet, r));
  return stamped as T[];
}

// React hook
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return getDB();
}
function getServerSnapshot() {
  return emptyDB();
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useRows<T = Row>(sheet: SheetName, filter?: Partial<Row>): T[] {
  const db = useDB();
  const rows = db[sheet] || [];
  if (!filter) return rows as T[];
  return rows.filter(r =>
    Object.entries(filter).every(([k, v]) => String(r[k] ?? "") === String(v ?? ""))
  ) as T[];
}

export function useAppsUrl(): [string, (u: string) => void] {
  const [url, setUrl] = useState(() => getAppsScriptUrl());
  useEffect(() => {
    const cb = () => setUrl(getAppsScriptUrl());
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return [url, (u: string) => { setAppsScriptUrl(u); setUrl(u); }];
}

// Initial pull from Apps Script (merge sheet rows that don't exist locally)
export async function pullFromSheet() {
  const url = getAppsScriptUrl();
  if (!url) return;
  try {
    const res = await fetch(`${url}?action=all&user_id=${encodeURIComponent(getUserId())}`);
    const json = await res.json();
    if (!json.ok) return;
    const remote = json.data as Record<SheetName, Row[]>;
    const db = getDB();
    const next = { ...db };
    SHEETS.forEach(s => {
      const idKey = primaryKey(s);
      const remoteRows = remote[s] || [];
      const map = new Map<string, Row>();
      next[s].forEach(r => map.set(r[idKey], r));
      remoteRows.forEach(r => { if (r[idKey] && !map.has(r[idKey])) map.set(r[idKey], r); });
      next[s] = Array.from(map.values());
    });
    commit(next);
  } catch (e) {
    console.warn("pull failed", e);
  }
}
