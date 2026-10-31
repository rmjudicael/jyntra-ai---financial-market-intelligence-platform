/**
 * JYNTRACK — local hypothesis book.
 *
 * The history is stored in the same browser-local store as the rest of the
 * user's workspace. It is a real, inspectable record: each check compares a
 * stored probability band with the closes actually observed afterwards. No
 * automatic learning is claimed; the calibration is a simple descriptive
 * statistic over matured records.
 */

import { LocalStore, STORAGE_KEYS } from './storage';
import type {
  JyntrackCalibration,
  JyntrackCheckSnapshot,
  JyntrackRealityCheck,
  JyntrackRecord,
} from '../types/jyntrack';

const MAX_RECORDS_PER_USER = 80;

function listAll(): JyntrackRecord[] {
  const records = LocalStore.get<JyntrackRecord[]>(STORAGE_KEYS.JYNTRACK, []);
  return Array.isArray(records) ? records.filter((record) => record && typeof record.id === 'string') : [];
}

function persist(records: JyntrackRecord[]): void {
  LocalStore.set(STORAGE_KEYS.JYNTRACK, records);
}

export class JyntrackStore {
  static list(userId: string): JyntrackRecord[] {
    return listAll()
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static save(record: JyntrackRecord): JyntrackRecord {
    const all = listAll().filter((item) => item.id !== record.id);
    all.unshift(record);
    const own = all.filter((item) => item.userId === record.userId);
    const overflow = own.slice(MAX_RECORDS_PER_USER).map((item) => item.id);
    persist(all.filter((item) => !overflow.includes(item.id)));
    return record;
  }

  static remove(userId: string, recordId: string): void {
    persist(listAll().filter((record) => !(record.userId === userId && record.id === recordId)));
  }

  static clear(userId: string): void {
    persist(listAll().filter((record) => record.userId !== userId));
  }

  static appendCheck(userId: string, recordId: string, check: JyntrackRealityCheck): JyntrackRecord | null {
    const all = listAll();
    const index = all.findIndex((record) => record.id === recordId && record.userId === userId);
    if (index < 0) return null;
    const snapshot: JyntrackCheckSnapshot = {
      at: Date.now(),
      observedBars: check.observedBars,
      observedReturnPct: check.observedReturnPct,
      lastPrice: check.lastPrice,
      bracket: check.bracket,
      assessment: check.assessment,
      invalidated: check.invalidated,
    };
    const record = all[index];
    all[index] = {
      ...record,
      lastCheck: check,
      checkHistory: [...(record.checkHistory || []), snapshot].slice(-40),
    };
    persist(all);
    return all[index];
  }

  static calibration(userId: string): JyntrackCalibration {
    const records = JyntrackStore.list(userId).filter((record) => record.lastCheck);
    const checks = records.map((record) => record.lastCheck as JyntrackRealityCheck);
    const withBand = checks.filter((check) => check.expected);
    const maturedRecords = records.filter((record) => record.lastCheck?.matured && record.lastCheck.expected);
    const mean = (values: number[]) => (values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : null);

    const inside50RatePct = withBand.length
      ? Number(((withBand.filter((check) => check.inside50).length / withBand.length) * 100).toFixed(1))
      : null;
    const inside90RatePct = withBand.length
      ? Number(((withBand.filter((check) => check.inside90).length / withBand.length) * 100).toFixed(1))
      : null;

    const errors = maturedRecords.map((record) => {
      const check = record.lastCheck as JyntrackRealityCheck;
      return check.observedReturnPct - record.expectedTerminalPct;
    });
    const meanBiasPct = mean(errors);
    const meanAbsoluteErrorPct = mean(errors.map((value) => Math.abs(value)));

    return {
      samples: records.length,
      matured: maturedRecords.length,
      inside50RatePct,
      inside90RatePct,
      meanBiasPct: meanBiasPct == null ? null : Number(meanBiasPct.toFixed(2)),
      meanAbsoluteErrorPct: meanAbsoluteErrorPct == null ? null : Number(meanAbsoluteErrorPct.toFixed(2)),
      invalidatedCount: checks.filter((check) => check.invalidated).length,
    };
  }
}
