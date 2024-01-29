'use client'

import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from '@heroicons/react/20/solid'
import { useLocalStorage } from '@uidotdev/usehooks'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import DisclosureRow, { RowData } from './DisclosureRow'
import { PlusIcon } from '@heroicons/react/24/solid'

const createInitialRow = (): RowData => ({
  id: Math.floor(Math.random() * 1000000),
})

export type SectionTitle = 'Permanenza' | 'Entrate' | 'Cabina privata'

const sections: SectionTitle[] = ['Permanenza', 'Entrate', 'Cabina privata']

const mergePermanences = (permanences: { from: string; to: string }[]) => {
  permanences.sort(
    (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
  )
  const mergedPermanences = [permanences[0]]

  for (let i = 1; i < permanences.length; i++) {
    const lastMergedPermanence = mergedPermanences[mergedPermanences.length - 1]
    if (
      new Date(permanences[i].from).getTime() <=
      new Date(lastMergedPermanence.to).getTime()
    ) {
      lastMergedPermanence.to =
        new Date(permanences[i].to).getTime() >
        new Date(lastMergedPermanence.to).getTime()
          ? permanences[i].to
          : lastMergedPermanence.to
    } else {
      mergedPermanences.push(permanences[i])
    }
  }

  return mergedPermanences
}

function diffStrings(a: string, b: string) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++
  }
  return {
    commonPrefix: a.substring(0, i),
    aDiff: a.substring(i),
    bDiff: b.substring(i),
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
  mergedPermanences: { from: string; to: string }[],
) => {
  for (const permanence of mergedPermanences) {
    const isFromOk =
      new Date(extraFrom).getTime() >= new Date(permanence.from).getTime()
    const isToOk =
      new Date(extraTo).getTime() <= new Date(permanence.to).getTime()

    if (isFromOk && isToOk) {
      return true
    }
  }

  return false
}

const validateSectionsDates = (rows: Record<string, RowData[]>) => {
  const permanences = rows['Permanenza'].filter((row) => row.from && row.to)
  const mergedPermanences = mergePermanences(
    permanences as { from: string; to: string }[],
  )

  const validateSection = (section: 'Entrate' | 'Cabina privata') => {
    rows[section].forEach((row, index) => {
      if (
        row.from &&
        (new Date(row.from).getTime() <
          new Date(mergedPermanences[0].from).getTime() ||
          new Date(row.from).getTime() >
            new Date(
              mergedPermanences[mergedPermanences.length - 1].to,
            ).getTime())
      ) {
        rows[section][index] = {
          ...row,
          error: {
            message:
              "Errore: La data di inizio deve cadere all'interno dei periodi di permanenza.",
            field: 'from',
          },
        }
      } else if (row.from && row.to) {
        if (!validateExtraDates(row.from, row.to, mergedPermanences)) {
          rows[section][index] = {
            ...row,
            error: {
              message:
                "Errore: Il periodo definito deve cadere all'interno dei periodi di permanenza.",
              field: 'both',
            },
          }
        } else {
          rows[section][index] = { ...row, error: undefined }
        }
      }
    })
  }

  validateSection('Entrate')
  validateSection('Cabina privata')
}

const Calculator = () => {
  const [rows, setRows] = useLocalStorage<Record<string, RowData[]>>(
    'rows',
    sections.reduce(
      (acc, section) => ({ ...acc, [section]: [createInitialRow()] }),
      {},
    ),
  )

  const [total, setTotal] = useState('0.00')

  const [sortedAndMergedPermanences, setSortedAndMergedPermanences] = useState<
    string[]
  >([])

  const calculateTotal = () => {
    // TODO: calculate total
    let newTotal = 0
    setTotal(newTotal.toFixed(2))
  }

  const handleAddRow = useCallback(
    (section: string) => () => {
      setRows((prevRows) => {
        prevRowsRef.current = JSON.stringify(prevRows)

        return {
          ...prevRows,
          [section]: [...prevRows[section], createInitialRow()],
        }
      })
    },
    [setRows],
  )

  const sortAndMerge = useCallback(
    (rows: Record<string, RowData[]>) => {
      console.log('sorting and merging')
      setSortedAndMergedPermanences((prev) => [...prev, 'a'])
    },
    [setSortedAndMergedPermanences],
  )

  const handleRemoveRow = useCallback(
    (section: string) => (index: number) => {
      setRows((prevRows) => {
        prevRowsRef.current = JSON.stringify(prevRows)
        const newRows = { ...prevRows }
        newRows[section].splice(index, 1)

        if (section === 'Permanenza') {
          sortAndMerge(newRows)
        }

        return newRows
      })
    },
    [setRows, sortAndMerge],
  )

  const handleUpdateRow = useCallback(
    (section: string) =>
      (
        index: number,
        field: keyof RowData | 'clear',
        value: string | number,
      ) => {
        console.log('updating row', section, index, field, value)
        setRows((prevRows) => {
          prevRowsRef.current = JSON.stringify(prevRows)
          const newRows = { ...prevRows }

          if (field === 'clear') {
            newRows[section][index] = createInitialRow()
          } else {
            newRows[section][index][field] = value as never
          }

          if (section === 'Permanenza') {
            sortAndMerge(newRows)
          }

          return newRows
        })
      },
    [setRows, sortAndMerge],
  )

  const prevRowsRef = useRef<string>('')

  useEffect(() => {
    if (prevRowsRef.current !== JSON.stringify(rows)) {
      // TODO: validate
      // make a diff between prevRows and rows
      console.log(
        'diff',
        diffStrings(prevRowsRef.current, JSON.stringify(rows)),
      )
    }
  }, [rows, sortedAndMergedPermanences])

  const isDisabled = (section: string, arg1: RowData): boolean | undefined => {
    const isValidDateRange =
      Date.parse(arg1.from ?? '') && Date.parse(arg1.to ?? '')

    if (!isValidDateRange) {
      return true
    }

    switch (section) {
      case 'Entrate':
        return (arg1.extraEntrances ?? 0) <= 0
      case 'Permanenza':
        return !arg1.category
      case 'Cabina privata':
        return false
      default:
        return undefined
    }
  }

  return (
    <Fragment>
      {sections.map((section, index) => (
        <Disclosure
          as="div"
          className="mt-1 rounded-lg rounded-b-none bg-gradient-to-b from-ecru"
          defaultOpen={index === 0}
          key={section}
        >
          <Disclosure.Button className="bg-primary flex w-full justify-between rounded-lg rounded-b-none px-4 py-2 text-left font-semibold text-coffee hover:bg-ash_gray focus:outline-none focus-visible:ring focus-visible:ring-tan">
            <span>{section}</span>
            <ChevronUpIcon className="h-8 w-8 transform text-coffee ui-open:rotate-180 ui-open:transform" />
          </Disclosure.Button>
          <Disclosure.Panel className="flex flex-col items-center justify-center text-jet sm:flex-row">
            <div className="w-11/12 pl-1.5">
              {rows[section].map((row, index) => (
                <DisclosureRow
                  key={row.id}
                  type={section}
                  row={row}
                  index={index}
                  updateRow={handleUpdateRow(section)}
                  removeRow={handleRemoveRow(section)}
                  addRow={handleAddRow(section)}
                />
              ))}
            </div>
            <div className="flex w-1/12 items-center justify-center">
              <button
                className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 font-bold text-white shadow-md hover:bg-green-700 disabled:bg-gray-300"
                onClick={handleAddRow(section)}
                title="Aggiungi una riga"
                disabled={isDisabled(
                  section,
                  rows[section][rows[section].length - 1],
                )}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </Disclosure.Panel>
        </Disclosure>
      ))}
      <div className="mt-4 flex justify-end gap-2 border-t-2 border-tan pt-2">
        <div className="flex w-full items-center justify-between px-2 py-2 sm:w-1/2">
          <button
            className="rounded-lg bg-coffee px-4 py-2 font-bold text-white shadow-md hover:bg-coffee-700 focus:outline-none focus-visible:ring focus-visible:ring-accent disabled:bg-gray-300"
            onClick={calculateTotal}
          >
            Calcola totale
          </button>
          <div className="text-3xl font-bold text-jet">&euro; {total}</div>
        </div>
      </div>
    </Fragment>
  )
}

export default Calculator
