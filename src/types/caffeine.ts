export type AgeGroup = 'under18' | 'adult' | 'over65'

export type MetabolismSpeed = 'fast' | 'standard' | 'slow'

export type RecordItem = {
  id: string
  label: string
  mg: number
  consumedAt: string
}

export type Settings = {
  ageGroup: AgeGroup
  metabolism: MetabolismSpeed
  sleepThresholdMg: number
}

export type DrinkPreset = {
  id: string
  label: string
  mg: number
  category: string
}

export type ChartPoint = {
  iso: string
  label: string
  mg: number
}
