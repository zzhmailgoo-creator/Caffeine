import type { AgeGroup, ChartPoint, DrinkPreset, MetabolismSpeed, RecordItem, Settings } from '../types/caffeine'

const PEAK_HOURS = 0.75
const HOURS_AHEAD = 24
const STEP_MINUTES = 10

const ageHalfLifeMap: Record<AgeGroup, number> = {
  under18: 4,
  adult: 5,
  over65: 6,
}

const metabolismMultiplierMap: Record<MetabolismSpeed, number> = {
  fast: 0.85,
  standard: 1,
  slow: 1.2,
}

export const ageLabelMap: Record<AgeGroup, string> = {
  under18: '18 岁以下',
  adult: '18-65 岁',
  over65: '65 岁以上',
}

export const metabolismLabelMap: Record<MetabolismSpeed, string> = {
  fast: '偏快',
  standard: '标准',
  slow: '偏慢',
}

export const DEFAULT_PRESETS: DrinkPreset[] = [
  { id: 'espresso', label: '意式浓缩', mg: 63, category: '咖啡' },
  { id: 'americano', label: '美式咖啡', mg: 120, category: '咖啡' },
  { id: 'tea', label: '茶饮', mg: 40, category: '茶' },
  { id: 'monster', label: '魔爪', mg: 160, category: '能量饮料' },
]

export const caffeineLevelTheme = {
  low: {
    background:
      'radial-gradient(circle at top left, rgba(255,255,255,0.96), transparent 34%), linear-gradient(180deg, #f7f7f5 0%, #efefeb 100%)',
    text: '#2f2c28',
  },
  medium: {
    background:
      'radial-gradient(circle at top left, rgba(255,255,255,0.96), transparent 34%), linear-gradient(180deg, #f6f5f2 0%, #ece9e2 100%)',
    text: '#2f2c28',
  },
  high: {
    background:
      'radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 34%), linear-gradient(180deg, #f7f4f2 0%, #ece5df 100%)',
    text: '#2f2c28',
  },
} as const

export function computeHalfLife(settings: Settings) {
  return ageHalfLifeMap[settings.ageGroup] * metabolismMultiplierMap[settings.metabolism]
}

export function computeRemainingCaffeine(
  records: RecordItem[],
  settings: Settings,
  now: Date,
) {
  const halfLife = computeHalfLife(settings)

  return records.reduce((sum, record) => {
    const consumedAt = new Date(record.consumedAt)
    const elapsedHours = (now.getTime() - consumedAt.getTime()) / (1000 * 60 * 60)

    if (elapsedHours <= 0) return sum

    return sum + singleDoseRemaining(record.mg, elapsedHours, halfLife)
  }, 0)
}

export function getDailyTotal(records: RecordItem[], now: Date) {
  return records.reduce((sum, record) => {
    const consumedAt = new Date(record.consumedAt)
    const isSameDay =
      consumedAt.getFullYear() === now.getFullYear() &&
      consumedAt.getMonth() === now.getMonth() &&
      consumedAt.getDate() === now.getDate()

    return isSameDay ? sum + record.mg : sum
  }, 0)
}

export function computeProjectedBelowThresholdTime(
  records: RecordItem[],
  settings: Settings,
  now: Date,
) {
  const current = computeRemainingCaffeine(records, settings, now)
  const threshold = settings.sleepThresholdMg
  let hasExceededThreshold = current > threshold

  for (let minute = STEP_MINUTES; minute <= HOURS_AHEAD * 60; minute += STEP_MINUTES) {
    const pointTime = new Date(now.getTime() + minute * 60 * 1000)
    const pointValue = computeRemainingCaffeine(records, settings, pointTime)

    if (pointValue > threshold) {
      hasExceededThreshold = true
    }

    if (hasExceededThreshold && pointValue <= threshold) {
      return pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  return hasExceededThreshold ? '超过 24 小时' : '当前已低于阈值'
}

export function createChartPoints(records: RecordItem[], settings: Settings, now: Date): ChartPoint[] {
  const points: ChartPoint[] = []

  for (let minute = 0; minute <= HOURS_AHEAD * 60; minute += STEP_MINUTES) {
    const pointTime = new Date(now.getTime() + minute * 60 * 1000)
    points.push({
      iso: pointTime.toISOString(),
      label: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mg: roundToOneDecimal(computeRemainingCaffeine(records, settings, pointTime)),
    })
  }

  return points
}

export function getCurrentLevelBand(currentMg: number) {
  if (currentMg >= 160) return 'high'
  if (currentMg >= 60) return 'medium'
  return 'low'
}

export function getThresholdStatusMessage(
  records: RecordItem[],
  settings: Settings,
  now: Date,
) {
  if (records.length === 0) {
    return '还没有记录，添加一次摄入后即可看到变化。'
  }

  const latestRecord = [...records].sort(
    (left, right) => new Date(right.consumedAt).getTime() - new Date(left.consumedAt).getTime(),
  )[0]

  const latestConsumedAt = new Date(latestRecord.consumedAt)
  const elapsedMinutes = (now.getTime() - latestConsumedAt.getTime()) / (1000 * 60)
  const current = computeRemainingCaffeine(records, settings, now)
  const projectedTime = computeProjectedBelowThresholdTime(records, settings, now)

  if (current <= settings.sleepThresholdMg && projectedTime === '当前已低于阈值') {
    return '当前影响较低，可继续按自己的节奏安排休息。'
  }

  if (elapsedMinutes >= 0 && elapsedMinutes < PEAK_HOURS * 60) {
    return `刚刚摄入，仍在吸收中，预计 ${projectedTime} 后逐步回落。`
  }

  return `当前已进入回落阶段，预计 ${projectedTime} 后低于阈值。`
}

function singleDoseRemaining(initialMg: number, elapsedHours: number, halfLifeHours: number) {
  if (elapsedHours < PEAK_HOURS) {
    const progress = elapsedHours / PEAK_HOURS
    return initialMg * smoothStep(progress)
  }

  const hoursSincePeak = elapsedHours - PEAK_HOURS
  return initialMg * Math.pow(0.5, hoursSincePeak / halfLifeHours)
}

function smoothStep(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1)
  return clamped * clamped * (3 - 2 * clamped)
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}
