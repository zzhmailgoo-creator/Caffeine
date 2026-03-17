import type { RecordItem, Settings } from '../types/caffeine'

const RECORDS_KEY = 'caffeine-tracker-records'
const SETTINGS_KEY = 'caffeine-tracker-settings'

export const defaultSettings: Settings = {
  ageGroup: 'adult',
  metabolism: 'standard',
  sleepThresholdMg: 20,
}

export function loadRecords(): RecordItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(RECORDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecordItem[]
    if (!Array.isArray(parsed)) return []
    return isSeededDemoRecords(parsed) ? [] : parsed
  } catch {
    return []
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

function isSeededDemoRecords(records: RecordItem[]) {
  if (records.length === 0 || records.length > 2) return false

  const demoLabels = new Set([
    'Morning Americano',
    'Afternoon Tea',
    '上午美式咖啡',
    '下午茶',
  ])

  return records.every((record) => demoLabels.has(record.label))
}
