export const TIME_RANGES = {
  PAST_HOUR: '1h',
  PAST_4_HOURS: '4h',
  PAST_DAY: '1d',
  PAST_7_DAYS: '7d',
  PAST_30_DAYS: '30d',
  PAST_90_DAYS: '90d',
  PAST_12_MONTHS: '12m',
  PAST_5_YEARS: '5y',
  ALL_TIME: 'all'
}

export const TIME_RANGE_OPTIONS = [
  { label: 'Past hour', value: TIME_RANGES.PAST_HOUR },
  { label: 'Past 4 hours', value: TIME_RANGES.PAST_4_HOURS },
  { label: 'Past day', value: TIME_RANGES.PAST_DAY },
  { label: 'Past 7 days', value: TIME_RANGES.PAST_7_DAYS },
  { label: 'Past 30 days', value: TIME_RANGES.PAST_30_DAYS },
  { label: 'Past 90 days', value: TIME_RANGES.PAST_90_DAYS },
  { label: 'Past 12 months', value: TIME_RANGES.PAST_12_MONTHS },
  { label: 'Past 5 years', value: TIME_RANGES.PAST_5_YEARS },
  { label: '2004 - present', value: TIME_RANGES.ALL_TIME },t
  { label: 'Custom time range...', value: 'custom' }
]

export const DEFAULT_TIME_RANGE = TIME_RANGES.PAST_30_DAYS 