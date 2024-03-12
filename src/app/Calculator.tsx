'use client'

import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useCallback, useEffect } from 'react'
import DisclosureRow, { RowData } from './DisclosureRow'
import { SettingsType, defaultSettings } from './Settings'

const createInitialRow = (): RowData => ({
  id: Math.floor(Math.random() * 1_000_000),
})

export type SectionTitle = 'Permanenza' | 'Entrate' | 'Cabina privata'

const sections: SectionTitle[] = ['Permanenza', 'Entrate', 'Cabina privata']

const singularPluralDays = (days: number, singular: string, plural: string) =>
  days === 1 ? `${days} ${singular}` : `${days} ${plural}`

const findMinMaxDates = (
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

const getDaysPerPeriod = (row: RowData, settings: SettingsType) => {
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

const getNumberOfDays = (from: string, to: string) => {
  if (!from || !to) {
    return 0
  }

  const start = new Date(from).getTime()
  const end = new Date(to).getTime()

  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24) + 1)
}

function diffStrings(a: string, b: string) {
  let index = 0
  while (index < a.length && index < b.length && a[index] === b[index]) {
    index++
  }
  return {
    commonPrefix: a.slice(0, index),
    aDiff: a.slice(index),
    bDiff: b.slice(index),
  }
}

const validateFromBeforeTo = (
  newRows: { [x: string]: RowData[] },
  section: string,
  index: number,
) => {
  if (newRows[section][index].from && newRows[section][index].to) {
    return (
      new Date(newRows[section][index].from as string).getTime() <=
      new Date(newRows[section][index].to as string).getTime()
    )
  }
  return true
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

const hasValidationErrors = (
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

const Calculator = () => {
  const [rows, setRows] = useLocalStorage<Record<string, RowData[]>>(
    'rows',
    Object.fromEntries(
      sections.map((section) => [section, [createInitialRow()]]),
    ),
  )

  /* 
  an object which contains the breakdown of the total price
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
  const [breakdown, setBreakdown] = useLocalStorage<
    Record<string, Record<string, Record<string, number> | number>>
  >('breakdown', {})

  const [total, setGrandTotal] = useLocalStorage<string>('total', '0.00')

  const [minMax, setMinMax] = useLocalStorage<{
    from: string
    to: string
    sorted: RowData[]
  }>('minMax', { from: '', to: '', sorted: [] })

  const settings: SettingsType = JSON.parse(
    localStorage.getItem('bufferSettings') ?? JSON.stringify(defaultSettings),
  ) as SettingsType

  const calculateTotal = useCallback(() => {
    let grandTotal = 0
    const breakdown: Record<
      string,
      Record<string, Record<string, number> | number>
    > = {}
    if (!hasValidationErrors(rows, minMax)) {
      let totDays = 0
      for (const row of rows['Permanenza']) {
        const daysPerPeriod = getDaysPerPeriod(row, settings)
        for (const period of daysPerPeriod) {
          const category = settings.periods[period.periodId].categories.find(
            (category) => category.name === row.category,
          )
          if (category) {
            const totalPrice = category.price * period.days
            // eslint-disable-next-line unicorn/no-negated-condition
            if (!breakdown[category.name]) {
              breakdown[category.name] = {
                [period.periodId]: {
                  days: period.days,
                  unitPrice: category.price,
                  totalPrice: totalPrice,
                },
              }
              // eslint-disable-next-line unicorn/no-negated-condition
            } else if (!breakdown[category.name][String(period.periodId)]) {
              breakdown[category.name][period.periodId] = {
                days: period.days,
                unitPrice: category.price,
                totalPrice: totalPrice,
              }
            } else {
              ;(
                breakdown[category.name][period.periodId] as Record<
                  string,
                  number
                >
              ).days += period.days
              ;(
                breakdown[category.name][period.periodId] as Record<
                  string,
                  number
                >
              ).totalPrice += totalPrice
            }
            totDays += period.days
            grandTotal += totalPrice
          }
        }
      }

      // special category in breakdown is 'Sconto' which is a reduction on the total price by 5 * (totDays - 15) if totDays > 15
      if (totDays > 15) {
        const discountedDays = totDays - 15
        const totalPrice = 5 * discountedDays * -1

        // eslint-disable-next-line unicorn/no-negated-condition
        if (!breakdown['Sconto']) {
          breakdown['Sconto'] = {
            discountedDays: discountedDays,
            unitPrice: 5,
            // should be negative
            totalPrice: totalPrice,
          }
        } else {
          ;(breakdown['Sconto'].discountedDays as number) = discountedDays
          ;(breakdown['Sconto'].totalPrice as number) = totalPrice
        }
        grandTotal += totalPrice
      }

      // entrate and cabina privata do not change price depending on periods
      // calculate the sum total of all the days for each row and multiply by the price
      for (const row of rows['Entrate']) {
        const entranceDays = getNumberOfDays(
          row.from as string,
          row.to as string,
        )
        const entrancePrice =
          settings.priceEntrance * entranceDays * (row.extraEntrances ?? 0)

        if (
          entranceDays === 0 ||
          (row.extraEntrances && row.extraEntrances <= 0)
        )
          continue

        // eslint-disable-next-line unicorn/no-negated-condition
        if (!breakdown['Entrate']) {
          breakdown['Entrate'] = {
            [String(row.id)]: {
              days: entranceDays,
              numEntrances: row.extraEntrances ?? 0,
              unitPrice: settings.priceEntrance,
              totalPrice: entrancePrice,
            },
          }
          // eslint-disable-next-line unicorn/no-negated-condition
        } else if (!breakdown['Entrate'][row.id]) {
          breakdown['Entrate'][row.id] = {
            days: entranceDays,
            numEntrances: row.extraEntrances ?? 0,
            unitPrice: settings.priceEntrance,
            totalPrice: entrancePrice,
          }
        } else {
          ;(breakdown['Entrate'][row.id] as Record<string, number>).days +=
            entranceDays
          ;(
            breakdown['Entrate'][row.id] as Record<string, number>
          ).totalPrice += entrancePrice
        }

        grandTotal += entrancePrice
      }

      for (const row of rows['Cabina privata']) {
        const boothDays = getNumberOfDays(row.from as string, row.to as string)
        const boothPrice = settings.priceBooth * boothDays

        if (boothDays === 0) continue

        // eslint-disable-next-line unicorn/no-negated-condition
        if (!breakdown['Cabina privata']) {
          breakdown['Cabina privata'] = {
            days: boothDays,
            unitPrice: settings.priceBooth,
            totalPrice: boothPrice,
          }
        } else {
          ;(breakdown['Cabina privata'].days as number) += boothDays
          ;(breakdown['Cabina privata'].totalPrice as number) += boothPrice
        }
        grandTotal += boothPrice
      }
    }

    setRows(rows)
    setBreakdown(breakdown)
    setGrandTotal(grandTotal.toFixed(2))
    // setTotal(newTotal.toFixed(2))
  }, [rows, settings, setRows, setBreakdown, setGrandTotal, minMax])

  const handleAddRow = useCallback(
    (section: string) => () => {
      setRows((previousRows) => {
        // previousRowsReference.current = JSON.stringify(previousRows)

        return {
          ...previousRows,
          [section]: [...previousRows[section], createInitialRow()],
        }
      })
    },
    [setRows],
  )

  const handleRemoveRow = useCallback(
    (section: string) => (index: number) => {
      setRows((previousRows) => {
        // previousRowsReference.current = JSON.stringify(previousRows)
        const newRows = { ...previousRows }
        newRows[section].splice(index, 1)

        if (section === 'Permanenza') {
          setMinMax(findMinMaxDates(newRows[section]))
        }

        return newRows
      })
    },
    [setRows, setMinMax],
  )

  const handleUpdateRow = useCallback(
    (section: string) =>
      (
        index: number,
        field: keyof RowData | 'clear',
        value: string | number,
      ) => {
        // console.log('updating row', section, index, field, value)
        setRows((previousRows) => {
          // previousRowsReference.current = JSON.stringify(previousRows)
          const newRows = { ...previousRows }

          if (field === 'clear') {
            newRows[section][index] = createInitialRow()
          } else {
            newRows[section][index][field] = value as never
          }

          if (section === 'Permanenza') {
            setMinMax(findMinMaxDates(newRows[section]))
          }

          return newRows
        })
      },
    [setRows, setMinMax],
  )

  // const previousRowsReference = useRef<string>('')

  const isDisabled = (section: string, row: RowData): boolean | undefined => {
    // console.log('isDisabled', section, row)

    const isValidDateRange =
      Date.parse(row.from ?? '') && Date.parse(row.to ?? '')

    if (!isValidDateRange) {
      return true
    }

    switch (section) {
      case 'Entrate': {
        return (row.extraEntrances ?? 0) <= 0
      }
      case 'Permanenza': {
        return !row.category
      }
      case 'Cabina privata': {
        return false
      }
      default: {
        return undefined
      }
    }
  }

  // update total when rows change
  useEffect(() => {
    calculateTotal()
  }, [rows, calculateTotal])

  return (
    <div className="min-w-max overflow-x-auto">
      {sections.map((section, index) => (
        <Disclosure
          as="div"
          className="mt-1 rounded-lg rounded-b-none bg-gradient-to-b from-ecru"
          defaultOpen={index === 0 || rows[section][0].from !== undefined}
          key={section}
        >
          <Disclosure.Button className="bg-primary flex w-full justify-between rounded-lg rounded-b-none px-4 py-2 text-left font-semibold text-coffee hover:bg-gradient-to-b hover:from-tan focus:outline-none focus-visible:ring focus-visible:ring-tan">
            <span>{section}</span>
            <ChevronUpIcon className="h-8 w-8 transform text-coffee ui-open:rotate-180 ui-open:transform" />
          </Disclosure.Button>
          <Disclosure.Panel className="flex flex-col items-center justify-center text-jet sm:flex-row">
            <div className="w-11/12 pl-1.5">
              {rows[section].map((row, index) => (
                <DisclosureRow
                  key={row.id}
                  section={section}
                  row={row}
                  index={index}
                  updateRow={handleUpdateRow(section)}
                  removeRow={handleRemoveRow(section)}
                  minMax={minMax}
                />
              ))}
            </div>
            <div className="flex w-1/12 items-center justify-center">
              <button
                className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 font-bold text-white shadow-md hover:bg-green-700 focus:outline-none focus-visible:ring focus-visible:ring-accent disabled:bg-gray-200 disabled:text-jet-800"
                onClick={handleAddRow(section)}
                title="Aggiungi una riga"
                disabled={isDisabled(
                  section,
                  // rows[section][rows[section].length - 1],
                  rows[section].at(-1) as RowData,
                )}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </Disclosure.Panel>
        </Disclosure>
      ))}
      <div className="mt-4 flex flex-col items-center justify-center gap-2 border-t-[1px] border-tan px-3 py-2">
        {Object.keys(breakdown)
          .filter(
            (key) =>
              key !== 'Sconto' && key !== 'Entrate' && key !== 'Cabina privata',
          )
          .map((key) => {
            return Object.keys(breakdown[key]).map((periodId) => {
              const days = (breakdown[key][periodId] as Record<string, number>)
                .days

              // eslint-disable-next-line unicorn/no-null
              if (days === 0) return null

              return (
                <div
                  key={key + periodId}
                  className="flex w-full items-center justify-end"
                >
                  <p className="text-right text-lg font-bold text-jet/80">
                    Permanenza {Number(periodId) + 1}&ordm; periodo per{' '}
                    {singularPluralDays(days, 'giorno', 'giorni')} a{' '}
                    {
                      (breakdown[key][periodId] as Record<string, number>)
                        .unitPrice
                    }
                    €/giorno:
                  </p>
                  <div className="w-1/3 text-right text-lg font-bold text-jet/80 sm:w-1/6">
                    {(
                      breakdown[key][periodId] as Record<string, number>
                    ).totalPrice.toFixed(2)}{' '}
                    &euro;
                  </div>
                </div>
              )
            })
          })}
        {breakdown['Sconto'] && (
          <div className="flex w-full items-center justify-end">
            <p className="text-right text-lg font-bold text-jet/80">
              {singularPluralDays(
                (breakdown['Sconto'] as Record<string, number>).discountedDays,
                'giorno scontato',
                'giorni scontati',
              )}{' '}
              a -5€/giorno:
            </p>
            <div className="w-1/3 text-right text-lg font-bold text-jet/80 sm:w-1/6">
              {(breakdown['Sconto'].totalPrice as number).toFixed(2)} &euro;
            </div>
          </div>
        )}
        {breakdown['Entrate'] &&
          Object.keys(breakdown['Entrate']).map((key) => {
            const days = (breakdown['Entrate'][key] as Record<string, number>)
              .days
            const entrances = (
              breakdown['Entrate'][key] as Record<string, number>
            ).numEntrances
            // eslint-disable-next-line unicorn/no-null
            if (days === 0) return null

            return (
              <div key={key} className="flex w-full items-center justify-end">
                <p className="text-right text-lg font-bold text-jet/80">
                  {singularPluralDays(entrances, 'ingresso', 'ingressi')} extra
                  per {singularPluralDays(days, 'giorno', 'giorni')} a{' '}
                  {
                    (breakdown['Entrate'][key] as Record<string, number>)
                      .unitPrice
                  }
                  €/giorno x ingresso:
                </p>
                <div className="w-1/3 text-right text-lg font-bold text-jet/80 sm:w-1/6">
                  {(
                    breakdown['Entrate'][key] as Record<string, number>
                  ).totalPrice.toFixed(2)}{' '}
                  &euro;
                </div>
              </div>
            )
          })}
        {breakdown['Cabina privata'] && (
          <div className="flex w-full items-center justify-end">
            <p className="text-right text-lg font-bold text-jet/80">
              Cabina privata per{' '}
              {singularPluralDays(
                (breakdown['Cabina privata'] as Record<string, number>).days,
                'giorno',
                'giorni',
              )}{' '}
              a{' '}
              {
                (breakdown['Cabina privata'] as Record<string, number>)
                  .unitPrice
              }
              €/giorno:
            </p>
            <div className="w-1/3 text-right text-lg font-bold text-jet/80 sm:w-1/6">
              {(breakdown['Cabina privata'].totalPrice as number).toFixed(2)}{' '}
              &euro;
            </div>
          </div>
        )}
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-3xl font-bold text-jet">Totale:</p>
          <div className="w-1/3 text-right text-3xl font-bold text-jet sm:w-1/6">
            {total} &euro;
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calculator
