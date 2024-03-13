'use client'

import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useCallback, useEffect } from 'react'
import DisclosureRow, {
  RowData,
  initializeRow,
  sections,
} from './DisclosureRow'
import { SettingsType, defaultSettings } from './Settings'
import {
  Breakdown,
  calculateTotal,
  findMinMaxDates,
  singularPluralDays,
} from './utilities'

const Calculator = () => {
  const [rows, setRows] = useLocalStorage<Record<string, RowData[]>>(
    'rows',
    Object.fromEntries(sections.map((section) => [section, [initializeRow()]])),
  )

  const [breakdown, setBreakdown] = useLocalStorage<Breakdown>('breakdown', {})

  const [total, setGrandTotal] = useLocalStorage<string>('total', '0.00')

  const [minMax, setMinMax] = useLocalStorage<{
    from: string
    to: string
    sorted: RowData[]
  }>('minMax', { from: '', to: '', sorted: [] })

  const settings: SettingsType = JSON.parse(
    localStorage.getItem('bufferSettings') ?? JSON.stringify(defaultSettings),
  ) as SettingsType

  const handleAddRow = useCallback(
    (section: string) => () => {
      setRows((previousRows) => {
        return {
          ...previousRows,
          [section]: [...previousRows[section], initializeRow()],
        }
      })
    },
    [setRows],
  )

  const handleRemoveRow = useCallback(
    (section: string) => (index: number) => {
      setRows((previousRows) => {
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
        setRows((previousRows) => {
          const newRows = { ...previousRows }

          if (field === 'clear') {
            newRows[section][index] = initializeRow()
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

  const isDisabled = (section: string, row: RowData): boolean | undefined => {
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

  useEffect(() => {
    const {
      breakdown,
      grandTotal,
    }: { breakdown: Breakdown; grandTotal: number } = calculateTotal(
      rows,
      minMax,
      settings,
    )
    setBreakdown(breakdown)
    setGrandTotal(grandTotal.toFixed(2))
  }, [rows, settings, setBreakdown, setGrandTotal, minMax])

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
      <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-jet shadow">
        {Object.keys(breakdown)
          .filter(
            (key) =>
              key !== 'Sconto' && key !== 'Entrate' && key !== 'Cabina privata',
          )
          .map((key) => {
            console.log('🚀 ~ .map ~ key:', key)
            return Object.keys(breakdown[key]).map((periodId) => {
              console.log('🚀 ~ returnObject.keys ~ periodId:', periodId)
              console.log('🚀 ~ returnObject.keys ~ key:', key)
              const days = (breakdown[key][periodId] as Record<string, number>)
                .days

              // eslint-disable-next-line unicorn/no-null
              if (days === 0) return null

              return (
                <div
                  key={key + periodId}
                  className="flex w-full items-center justify-end"
                >
                  <p className="text-right text-lg">
                    Permanenza {Number(periodId) + 1}&ordm; periodo per{' '}
                    {singularPluralDays(days, 'giorno', 'giorni')} a{' '}
                    {
                      (breakdown[key][periodId] as Record<string, number>)
                        .unitPrice
                    }
                    €/giorno:
                  </p>
                  <div className="w-1/3 text-right text-lg sm:w-1/6">
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
            <p className="text-right text-lg">
              {singularPluralDays(
                (breakdown['Sconto'] as Record<string, number>).days,
                'giorno scontato',
                'giorni scontati',
              )}{' '}
              a -{settings.priceDiscount}€/giorno:
            </p>
            <div className="w-1/3 text-right text-lg sm:w-1/6">
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
            if (days === 0 || entrances === 0) return null

            return (
              <div key={key} className="flex w-full items-center justify-end">
                <p className="text-right text-lg">
                  {singularPluralDays(entrances, 'ingresso', 'ingressi')} extra
                  per {singularPluralDays(days, 'giorno', 'giorni')} a{' '}
                  {
                    (breakdown['Entrate'][key] as Record<string, number>)
                      .unitPrice
                  }
                  €/giorno x ingresso:
                </p>
                <div className="w-1/3 text-right text-lg sm:w-1/6">
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
            <p className="text-right text-lg">
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
            <div className="w-1/3 text-right text-lg sm:w-1/6">
              {(breakdown['Cabina privata'].totalPrice as number).toFixed(2)}{' '}
              &euro;
            </div>
          </div>
        )}
        <div className="flex w-full items-center justify-end">
          <p className="text-right text-xl font-bold">Totale:</p>
          <div className="w-1/3 text-right text-xl font-bold sm:w-1/6">
            {total} &euro;
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calculator
