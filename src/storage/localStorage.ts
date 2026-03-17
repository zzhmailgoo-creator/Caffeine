import type { RecordItem, Settings } from '../types/caffeine'

const RECORDS_KEY = 'caffeine-tracker-records'
const SETTINGS_KEY = 'caffeine-tracker-settings'

export const defaultSettings: Settings = {
  ageGroup: 'adult',
  metabolism: 'standard',
  sleepThresholdMg: 20,
}

export function loadRecords(): RecordItem[] {
  const fallback = createSampleRecords()

  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(RECORDS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as RecordItem[]
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveRecords(records: RecordItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function createRecord(label: string, mg: number, consumedAt: string): RecordItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label,
    mg,
    consumedAt,
  }
}

export function createSampleRecords(): RecordItem[] {
  const now = new Date()

  return [
    createRecord('Morning Americano', 120, hoursAgo(now, 5.5).toISOString()),
    createRecord('Afternoon Tea', 40, hoursAgo(now, 2).toISOString()),
  ].sort((left, right) => new Date(right.consumedAt).getTime() - new Date(left.consumedAt).getTime())
}

function hoursAgo(base: Date, hours: number) {
  return new Date(base.getTime() - hours * 60 * 60 * 1000)
}
