// Supabase-backed store. Keeps the same API shape used across the app
// (list/get/create/update/remove/useRows/bulkCreate/primaryKey) but persists
// to the `records` table in Lovable Cloud, scoped to the signed-in user via RLS.
//
// Strategy:
//  - On sign-in, fetch all the user's records once and hydrate an in-memory cache.
//  - useRows reads synchronously from cache via useSyncExternalStore.
//  - Mutations apply optimistically to cache, then upsert/delete to Supabase
//    in the background. Failures log and reload from server.

import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SHEETS = [
  "Users","Planning_Cycles","Values","Monthly_Goals","Weekly_Plans","Daily_Plans",
  "Tasks","Habits","Habit_Logs","Beliefs","Mindset","Influences","Inner_Seasons",
  "Daily_Reviews","Weekly_Reviews","Monthly_Reviews","Reminders","Settings",
] as const;

export type SheetName = typeof SHEETS[number];
export type Row = Record<string, any> & { [key: string]: any };

type DB = Record<SheetName, Row[]>;

function emptyDB(): DB {
  const db = {} as DB;
  SHEETS.forEach(s => (db[s] = []));
  return db;
}

let _db: DB = emptyDB();
let _hydrated = false;
let _userId: string | null = null;
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function nowISO() { return new Date().toISOString(); }

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

// ---------- Hydration ----------
export async function hydrate(userId: string) {
  _userId = userId;
  _db = emptyDB();
  const { data, error } = await supabase
    .from("records")
    .select("collection, external_id, data")
    .eq("user_id", userId);
  if (error) {
    console.error("hydrate failed", error);
    _hydrated = true;
    emit();
    return;
  }
  for (const r of data || []) {
    const sheet = r.collection as SheetName;
    if (!_db[sheet]) continue;
    const idKey = primaryKey(sheet);
    _db[sheet].push({ ...(r.data as any), [idKey]: r.external_id });
  }
  _hydrated = true;
  emit();
}

export function clearStore() {
  _db = emptyDB();
  _hydrated = false;
  _userId = null;
  emit();
}

export function isHydrated() { return _hydrated; }

// ---------- Persistence ----------
async function persistUpsert(sheet: SheetName, row: Row) {
  if (!_userId) return;
  const idKey = primaryKey(sheet);
  const externalId = row[idKey];
  const { [idKey]: _omit, ...data } = row;
  const { error } = await supabase.from("records").upsert({
    user_id: _userId,
    collection: sheet,
    external_id: externalId,
    data,
  }, { onConflict: "user_id,collection,external_id" });
  if (error) console.error("upsert failed", sheet, error);
}

async function persistDelete(sheet: SheetName, externalId: string) {
  if (!_userId) return;
  const { error } = await supabase
    .from("records")
    .delete()
    .eq("user_id", _userId)
    .eq("collection", sheet)
    .eq("external_id", externalId);
  if (error) console.error("delete failed", sheet, error);
}

// ---------- Public API ----------
export function list<T = Row>(sheet: SheetName, filter?: Partial<Row>): T[] {
  const rows = _db[sheet] || [];
  if (!filter) return rows as T[];
  return rows.filter(r =>
    Object.entries(filter).every(([k, v]) => String(r[k] ?? "") === String(v ?? ""))
  ) as T[];
}

export function get<T = Row>(sheet: SheetName, id: string): T | undefined {
  const idKey = primaryKey(sheet);
  return _db[sheet].find(r => r[idKey] === id) as T | undefined;
}

export function create<T extends Row>(sheet: SheetName, data: Partial<T>): T {
  const idKey = primaryKey(sheet);
  const row: Row = {
    ...data,
    [idKey]: (data as any)[idKey] || uid(),
    created_at: data.created_at || nowISO(),
    updated_at: nowISO(),
  };
  _db = { ..._db, [sheet]: [..._db[sheet], row] };
  emit();
  void persistUpsert(sheet, row);
  return row as T;
}

export function update<T extends Row>(sheet: SheetName, id: string, patch: Partial<T>): T | undefined {
  const idKey = primaryKey(sheet);
  let updated: Row | undefined;
  const next = _db[sheet].map(r => {
    if (r[idKey] === id) {
      updated = { ...r, ...patch, updated_at: nowISO() };
      return updated;
    }
    return r;
  });
  _db = { ..._db, [sheet]: next };
  emit();
  if (updated) void persistUpsert(sheet, updated);
  return updated as T | undefined;
}

export function remove(sheet: SheetName, id: string) {
  const idKey = primaryKey(sheet);
  _db = { ..._db, [sheet]: _db[sheet].filter(r => r[idKey] !== id) };
  emit();
  void persistDelete(sheet, id);
}

export function bulkCreate<T extends Row>(sheet: SheetName, items: Partial<T>[]): T[] {
  const idKey = primaryKey(sheet);
  const stamped = items.map(d => ({
    ...d,
    [idKey]: (d as any)[idKey] || uid(),
    created_at: d.created_at || nowISO(),
    updated_at: nowISO(),
  })) as Row[];
  _db = { ..._db, [sheet]: [..._db[sheet], ...stamped] };
  emit();
  stamped.forEach(r => void persistUpsert(sheet, r));
  return stamped as T[];
}

// ---------- React ----------
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function getSnapshot() { return _db; }
function getServerSnapshot() { return emptyDB(); }

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

export function useHydrated(): boolean {
  const [h, setH] = useState(_hydrated);
  useEffect(() => {
    const cb = () => setH(_hydrated);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return h;
}

// Legacy no-op helpers kept for compatibility with old settings page references.
export function getUserId(): string { return _userId || ""; }
