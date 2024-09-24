'use client'
import { RowData } from './DisclosureRow'
import { Category, SettingsType } from './Settings'

/*
  The breakdown of the total price
  it should contain categories (e.g. '1', '2', '3', 'Entrate', 'Cabina privata')
  Each category should be also subdivided by period (Entrate and Cabina privata do not have periods, so they should be a single entry, but Entrate should be have the number of extra entrances)
  and for each period, the number of days, the unit price and the total price
  {
    '1': {
      '0': {
        days: 10,
        unitPrice: 5,
        totalPrice: 50
      },
      '1': {
        days: 5,
        unitPrice: 3,
        totalPrice: 15
      }
    },
    '2': {
      '0': {
        days: 10,
        unitPrice: 5,
        totalPrice: 50
      },
      '1': {
        days: 5,
        unitPrice: 3,
        totalPrice: 15
      }
    },
    'Entrate': {
      days: 10,
      numEntrances: 2,
      unitPrice: 5,
      totalPrice: 100
    },
    'Cabina privata': {
      days: 10,
      unitPrice: 5,
      totalPrice: 50
    }
  }
*/
export type Breakdown = Record<
  string,
  Record<string, Record<string, number> | number>
>

export const singularPluralDays = (
  days: number,
  singular: string,
  plural: string,
) => (days === 1 ? `${days} ${singular}` : `${days} ${plural}`)

export const findMinMaxDates = (
  rows: RowData[],
): { from: string; to: string; sorted: RowData[] } => {
  const permanenceRows = rows.filter((row) => row.from && row.to)

  if (permanenceRows.length === 0) {
    return { from: '', to: '', sorted: [] }
  }

  permanenceRows.sort(
    (a, b) =>
      new Date(a.from as string).getTime() -
      new Date(b.from as string).getTime(),
  )

  let minFrom = permanenceRows[0]?.from
  let maxTo = permanenceRows[0]?.to

  for (const row of permanenceRows) {
    if (
      row.from &&
      (!minFrom || new Date(row.from).getTime() < new Date(minFrom).getTime())
    ) {
      minFrom = row.from
    }
    if (
      row.to &&
      (!maxTo || new Date(row.to).getTime() > new Date(maxTo).getTime())
    ) {
      maxTo = row.to
    }
  }

  return {
    from: minFrom as string,
    to: maxTo as string,
    sorted: permanenceRows,
  }
}

/*
  Given a row: RowData and settings: SettingsType, returns the number of days for each period that the rows covers:

  for example, if the settings are:
  
  {
  periods: Period[]
  priceEntrance: number
  priceBooth: number
  closingDate: string
}

with Period being:

{ id: number; start: string; categories: Category[] }

and Category being:

{ id: number; name: string; price: number }

example:
  
  {
    periods: [
      {
        id: 0,
        start: '2021-08-01',
        categories: [
          { id: 0, name: '1', price: 5 },
          { id: 1, name: '2', price: 3 },
        ],
      },
      {
        id: 1,
        start: '2021-08-15',
        categories: [
          { id: 0, name: '1', price: 3 },
          { id: 1, name: '2', price: 2 },
        ],
      },
      {
        id: 2,
        start: '2021-09-01',
        categories: [
          { id: 0, name: '1', price: 2 },
          { id: 1, name: '2', price: 1 },
        ],
      },
    ],
    priceEntrance: 5,
    priceBooth: 5,
    closingDate: '2021-09-31',
  }

  the function, given a row like:
  
    {
      from: '2021-08-05',
      to: '2021-08-20',
      category: '1',
      extraEntrances: 2,
      extraBooths: 1,
    }

  will return:

    [
      { periodId: 0, days: 10 },
      { periodId: 1, days: 5 },
      { periodId: 2, days: 0 },
    ]


*/
export const getDaysPerPeriod = (row: RowData, settings: SettingsType) => {
  const { periods, closingDate } = settings
  const { from, to } = row

  if (!from || !to) {
    return []
  }

  const rowStart = new Date(from).getTime()
  const rowEnd = new Date(to).getTime()

  const daysPerPeriod = periods.map((period) => {
    const periodStart = new Date(period.start).getTime()
    const periodEnd =
      period.id === periods.length - 1
        ? new Date(closingDate).getTime()
        : new Date(
            new Date(periods[period.id + 1].start).getTime() -
              24 * 60 * 60 * 1000,
          ).getTime()

    const start = Math.max(periodStart, rowStart)
    const end = Math.min(periodEnd, rowEnd)

    const days = Math.max(0, (end - start) / (1000 * 60 * 60 * 24) + 1)

    return { periodId: period.id, days }
  })

  return daysPerPeriod
}

export const getNumberOfDays = (from: string, to: string) => {
  if (!from || !to) {
    return 0
  }

  const start = new Date(from).getTime()
  const end = new Date(to).getTime()

  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24) + 1)
}

const validateExtraDates = (
  extraFrom: string,
  extraTo: string,
  mergedPermanences: RowData[],
) => {
  for (const permanence of mergedPermanences) {
    const isFromOk =
      new Date(extraFrom).getTime() >=
      new Date(permanence.from as string).getTime()
    const isToOk =
      new Date(extraTo).getTime() <= new Date(permanence.to as string).getTime()

    if (isFromOk && isToOk) {
      return true
    }
  }

  return false
}

export const hasValidationErrors = (
  rows: Record<string, RowData[]>,
  minMax: { from: string; to: string; sorted: RowData[] },
) => {
  let hasError = false

  const validateSection = (section: 'Entrate' | 'Cabina privata') => {
    for (const row of rows[section]) {
      if (
        row.from &&
        (new Date(row.from).getTime() < new Date(minMax.from).getTime() ||
          new Date(row.from).getTime() > new Date(minMax.to).getTime())
      ) {
        row.error = {
          message:
            "Errore: La data di inizio deve cadere all'interno dei periodi di permanenza.",
          field: 'from',
        }
        hasError = true
      } else if (row.from && row.to) {
        if (validateExtraDates(row.from, row.to, minMax.sorted)) {
          row.error = undefined
        } else {
          row.error = {
            message:
              "Errore: Il periodo definito deve cadere all'interno dei periodi di permanenza.",
            field: 'both',
          }
          hasError = true
        }
      }
    }
  }

  validateSection('Entrate')
  validateSection('Cabina privata')

  return hasError
}

const updateBreakdown = (
  breakdown: Breakdown,
  key: string,
  values: Record<string, number>,
  subKey?: string | number,
) => {
  if (subKey !== undefined && subKey !== null) {
    breakdown[key] = breakdown[key] ?? {}
  }

  const target = (
    subKey !== undefined && subKey !== null
      ? breakdown[key][subKey]
      : breakdown[key]
  ) as Record<string, number>

  if (target) {
    target.days += values.days
    target.totalPrice += values.totalPrice
  } else if (subKey !== undefined && subKey !== null) {
    breakdown[key][subKey] = { ...values }
  } else {
    breakdown[key] = { ...values }
  }
}

const calculateCategoryTotal = (
  category: Category,
  period: { periodId: number; days: number },
  breakdown: Breakdown,
) => {
  const totalPrice = category.price * period.days
  updateBreakdown(
    breakdown,
    category.name,
    {
      days: period.days,
      unitPrice: category.price,
      totalPrice: category.price * period.days,
    },
    period.periodId,
  )
  return totalPrice
}

const calculateDiscount = (
  permanenceDays: number,
  settings: SettingsType,
  breakdown: Breakdown,
) => {
  if (permanenceDays <= settings.daysNoDiscount) return 0

  const totalPrice = -settings.priceDiscount * permanenceDays
  updateBreakdown(breakdown, 'Sconto', {
    days: permanenceDays,
    unitPrice: -settings.priceDiscount,
    totalPrice,
  })
  return totalPrice
}

const calculateEntranceTotal = (
  row: RowData,
  settings: SettingsType,
  breakdown: Breakdown,
) => {
  const days = getNumberOfDays(row.from as string, row.to as string)

  if (days === 0 || (row.extraEntrances && row.extraEntrances <= 0)) return 0

  const totalPrice = settings.priceEntrance * days * (row.extraEntrances ?? 0)
  updateBreakdown(
    breakdown,
    'Entrate',
    {
      days,
      numEntrances: row.extraEntrances ?? 0,
      unitPrice: settings.priceEntrance,
      totalPrice,
    },
    row.id,
  )
  return totalPrice
}

const calculateBoothTotal = (
  row: RowData,
  settings: SettingsType,
  breakdown: Breakdown,
) => {
  const days = getNumberOfDays(row.from as string, row.to as string)
  const totalPrice = settings.priceBooth * days

  if (days === 0) return 0

  updateBreakdown(breakdown, 'Cabina privata', {
    days,
    unitPrice: settings.priceBooth,
    totalPrice,
  })
  return totalPrice
}

export const calculateTotal = (
  rows: Record<string, RowData[]>,
  minMax: { from: string; to: string; sorted: RowData[] },
  settings: SettingsType,
) => {
  let grandTotal = 0
  const breakdown: Record<
    string,
    Record<string, Record<string, number> | number>
  > = {}
  if (!hasValidationErrors(rows, minMax)) {
    let permanenceDays = 0
    for (const row of rows['Permanenza']) {
      const daysPerPeriod = getDaysPerPeriod(row, settings)
      for (const period of daysPerPeriod) {
        const category = settings.periods[period.periodId].categories.find(
          (category) => category.name === row.category,
        )
        if (category) {
          const totalPrice = calculateCategoryTotal(category, period, breakdown)
          permanenceDays += period.days
          grandTotal += totalPrice
        }
      }
    }
    grandTotal += calculateDiscount(permanenceDays, settings, breakdown)
    for (const row of rows['Entrate']) {
      grandTotal += calculateEntranceTotal(row, settings, breakdown)
    }
    for (const row of rows['Cabina privata']) {
      grandTotal += calculateBoothTotal(row, settings, breakdown)
    }
  }
  return { breakdown, grandTotal }
}
