import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  DEFAULT_PRESETS,
  ageLabelMap,
  caffeineLevelTheme,
  computeProjectedBelowThresholdTime,
  computeRemainingCaffeine,
  createChartPoints,
  getCurrentLevelBand,
  getDailyTotal,
  getThresholdStatusMessage,
  metabolismLabelMap,
} from './engine/caffeine'
import {
  createRecord,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
} from './storage/localStorage'
import type { AgeGroup, MetabolismSpeed, RecordItem, Settings } from './types/caffeine'

const ageOptions: AgeGroup[] = ['under18', 'adult', 'over65']
const metabolismOptions: MetabolismSpeed[] = ['fast', 'standard', 'slow']
const recordLabelMap: Record<string, string> = {
  'Morning Americano': '上午美式咖啡',
  'Afternoon Tea': '下午茶',
  Espresso: '意式浓缩',
  Americano: '美式咖啡',
  Tea: '茶饮',
  Monster: '魔爪',
  'Custom drink': '自定义饮品',
}

function App() {
  const [records, setRecords] = useState<RecordItem[]>(() => loadRecords())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [selectedDrinkId, setSelectedDrinkId] = useState(DEFAULT_PRESETS[0].id)
  const [customLabel, setCustomLabel] = useState('自定义饮品')
  const [customMg, setCustomMg] = useState('95')
  const [customTime, setCustomTime] = useState(() => formatLocalDateTimeInput(new Date()))
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [sleepThresholdInput, setSleepThresholdInput] = useState(() => String(loadSettings().sleepThresholdMg))

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const now = useMemo(() => new Date(nowMs), [nowMs])

  const currentRemaining = useMemo(
    () => computeRemainingCaffeine(records, settings, now),
    [records, settings, now],
  )

  const totalToday = useMemo(() => getDailyTotal(records, now), [records, now])

  const thresholdTime = useMemo(
    () => computeProjectedBelowThresholdTime(records, settings, now),
    [records, settings, now],
  )

  const chartPoints = useMemo(
    () => createChartPoints(records, settings, now),
    [records, settings, now],
  )

  const thresholdStatusMessage = useMemo(
    () => getThresholdStatusMessage(records, settings, now),
    [records, settings, now],
  )

  const currentBand = getCurrentLevelBand(currentRemaining)
  const theme = caffeineLevelTheme[currentBand]
  const selectedPreset = DEFAULT_PRESETS.find((item) => item.id === selectedDrinkId)
  const isCustomDrink = selectedDrinkId === 'custom'

  const addRecord = (label: string, mg: number, consumedAt: string) => {
    const trimmedLabel = label.trim() || 'Custom drink'
    if (!Number.isFinite(mg) || mg <= 0) return

    setRecords((prev) =>
      [createRecord(trimmedLabel, Math.round(mg), new Date(consumedAt).toISOString()), ...prev].sort(
        (left, right) => new Date(right.consumedAt).getTime() - new Date(left.consumedAt).getTime(),
      ),
    )
  }

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCustomDrink) {
      addRecord(customLabel, Number(customMg), customTime)
      return
    }

    if (!selectedPreset) return
    addRecord(selectedPreset.label, selectedPreset.mg, customTime)
  }

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: theme.background, color: theme.text }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="px-1 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[color:var(--muted)]">
            今日咖啡因
          </p>
          <h1 className="mt-3 max-w-3xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[color:var(--heading)] sm:text-[3.4rem]">
            用更清晰的方式，查看今天的摄入与回落时间。
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
            记录一杯饮品后，当前残留、今日累计和回落时间会立即更新。
          </p>
        </header>

        <main className="mt-7 space-y-4">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Panel
              title="添加记录"
              subtitle="选择饮品和时间，快速记下这一次摄入。"
            >
              <form className="grid gap-3 md:grid-cols-[1.15fr_1fr_auto]" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                  饮品
                  <select
                    value={selectedDrinkId}
                    onChange={(event) => setSelectedDrinkId(event.target.value)}
                    className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
                  >
                    {DEFAULT_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} ({preset.mg} mg)
                      </option>
                    ))}
                    <option value="custom">自定义</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                  时间
                  <input
                    type="datetime-local"
                    value={customTime}
                    onChange={(event) => setCustomTime(event.target.value)}
                    className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-auto rounded-[1rem] bg-[#2f6fed] px-5 py-3 font-medium text-white shadow-[0_10px_20px_rgba(47,111,237,0.18)] transition hover:bg-[#245fd1]"
                >
                  添加记录
                </button>
              </form>

              <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                {isCustomDrink
                  ? '支持手动填写饮品名称和咖啡因含量，更贴近你的实际习惯。'
                  : `已选择 ${selectedPreset?.label ?? ''}，参考值为 ${selectedPreset?.mg ?? 0} mg`}
              </div>

              {isCustomDrink ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                    自定义名称
                    <input
                      value={customLabel}
                      onChange={(event) => setCustomLabel(event.target.value)}
                      className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                    咖啡因含量 (mg)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customMg}
                      onChange={(event) => setCustomMg(event.target.value)}
                      className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
                    />
                  </label>
                </div>
              ) : null}
            </Panel>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MetricCard
                  label="当前估算残留"
                  value={`${currentRemaining.toFixed(0)} mg`}
                  note="此刻体内的大致残留"
                />
                <MetricCard
                  label="今日累计摄入"
                  value={`${totalToday.toFixed(0)} mg`}
                  note="今天到目前为止的总摄入"
                />
                <MetricCard
                  label="预计回落时间"
                  value={thresholdTime}
                  note={thresholdStatusMessage}
                />
              </div>

              <Panel title="设置" subtitle="根据习惯调整估算方式。">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="年龄范围"
                      value={settings.ageGroup}
                      onChange={(value) =>
                        setSettings((prev) => ({ ...prev, ageGroup: value as AgeGroup }))
                      }
                      options={ageOptions.map((option) => ({
                        label: ageLabelMap[option],
                        value: option,
                      }))}
                    />
                    <SelectField
                      label="代谢速度"
                      value={settings.metabolism}
                      onChange={(value) =>
                        setSettings((prev) => ({ ...prev, metabolism: value as MetabolismSpeed }))
                      }
                      options={metabolismOptions.map((option) => ({
                        label: metabolismLabelMap[option],
                        value: option,
                      }))}
                    />
                  </div>

                  <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
                    休息阈值 (mg)
                    <input
                      type="number"
                      min="5"
                      max="120"
                      step="1"
                      value={sleepThresholdInput}
                      onChange={(event) => {
                        const { value } = event.target
                        setSleepThresholdInput(value)

                        if (value === '') return

                        const parsed = Number(value)
                        if (!Number.isFinite(parsed)) return

                        setSettings((prev) => ({
                          ...prev,
                          sleepThresholdMg: parsed,
                        }))
                      }}
                      onBlur={() => {
                        const parsed = Number(sleepThresholdInput)
                        if (!Number.isFinite(parsed)) {
                          setSleepThresholdInput(String(settings.sleepThresholdMg))
                          return
                        }

                        const normalized = Math.min(120, Math.max(5, parsed))
                        setSettings((prev) => ({
                          ...prev,
                          sleepThresholdMg: normalized,
                        }))
                        setSleepThresholdInput(String(normalized))
                      }}
                      className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
                    />
                  </label>
                </div>
              </Panel>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Panel
              title="24 小时趋势"
              subtitle="查看接下来 24 小时的变化趋势。"
            >
              <div className="h-[320px] w-full">
                <ResponsiveContainer>
                  <AreaChart data={chartPoints} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                    <defs>
                      <linearGradient id="caffeineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2f6fed" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2f6fed" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(24, 28, 33, 0.08)" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                      tick={{ fill: '#7a7670', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={42}
                      tick={{ fill: '#7a7670', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '14px',
                        border: '1px solid rgba(24, 28, 33, 0.08)',
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        boxShadow: '0 12px 30px rgba(24, 28, 33, 0.08)',
                      }}
                    />
                    <ReferenceLine
                      y={settings.sleepThresholdMg}
                      stroke="#a7a19a"
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                    />
                    <Area
                      type="monotone"
                      dataKey="mg"
                      stroke="#2f6fed"
                      strokeWidth={2.5}
                      fill="url(#caffeineFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="最近记录" subtitle="按时间顺序查看刚刚记录的内容。">
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                      key={record.id}
                      className="flex items-center justify-between rounded-[1rem] border border-[rgba(24,28,33,0.06)] bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[color:var(--heading)]">
                        {localizeRecordLabel(record.label)}
                      </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {record.mg} mg · {new Date(record.consumedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecord(record.id)}
                      className="ml-3 rounded-full border border-[rgba(24,28,33,0.08)] bg-[#f7f8fa] px-3 py-1.5 text-sm text-[color:var(--muted)] transition hover:border-[rgba(47,111,237,0.16)] hover:text-[color:var(--heading)]"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  note: string
}

function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="rounded-[1.4rem] border border-[rgba(24,28,33,0.06)] bg-white p-5 shadow-[0_12px_30px_rgba(24,28,33,0.04)]">
      <p className="text-[12px] font-medium tracking-[-0.01em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[color:var(--heading)]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{note}</p>
    </div>
  )
}

type PanelProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="rounded-[1.5rem] border border-[rgba(24,28,33,0.06)] bg-white p-5 shadow-[0_14px_32px_rgba(24,28,33,0.04)] md:p-6">
      <div className="mb-5">
        <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[color:var(--heading)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[color:var(--muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[1rem] border border-[rgba(24,28,33,0.08)] bg-white px-4 py-3 text-[color:var(--heading)] outline-none transition focus:border-[rgba(66,86,119,0.18)] focus:ring-4 focus:ring-[rgba(66,86,119,0.08)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default App

function formatLocalDateTimeInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function localizeRecordLabel(label: string) {
  return recordLabelMap[label] ?? label
}
