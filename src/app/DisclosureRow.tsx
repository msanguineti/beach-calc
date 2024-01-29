import { Listbox, Transition } from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronUpDownIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import { SectionTitle } from './Calculator'

const categories = [
  { id: '1', name: 'Categoria 1' },
  { id: '2', name: 'Categoria 2' },
  { id: '3', name: 'Categoria 3' },
]

export type RowData = {
  id: number
  from?: string
  to?: string
  // fromInputType: 'text' | 'date'
  // toInputType: 'text' | 'date'
  category?: string
  extraEntrances?: number
  error?: {
    message: string
    field: 'from' | 'to' | 'both' | 'extraEntrances'
  }
}

type DisclosureRowProps = {
  type: SectionTitle
  row: RowData
  index: number
  categories?: { id: string; name: string }[]
  updateRow: (
    index: number,
    field: keyof RowData | 'clear',
    value: string | number,
  ) => void
  removeRow: (index: number) => void
  addRow: () => void
}

const isDisabled = (type: string, row: RowData): boolean | undefined => {
  return (
    (type === 'Entrate' && (row.extraEntrances ?? 0) <= 0) ||
    (type === 'Permanenza' && !row.category) ||
    !Date.parse(row.from ?? '') ||
    !Date.parse(row.to ?? '')
  )
}

const rowHasData = (row: RowData) =>
  Object.entries(row).some(
    ([key, value]) =>
      !['id', 'fromInputType', 'toInputType'].includes(key) &&
      value !== null &&
      value !== '',
  )

const DisclosureRow: React.FC<DisclosureRowProps> = ({
  type,
  row,
  index,
  updateRow,
  removeRow,
  addRow,
}) => {
  console.log('rendering row', row)

  return (
    <Fragment>
      <div className="mt-2 flex items-center gap-2 first:mt-3 last:mb-3">
        <input
          type="date"
          placeholder="Dal"
          value={row.from}
          onChange={(e) => updateRow(index, 'from', e.target.value)}
          className={`w-1/4 rounded-lg px-3 py-2 text-left shadow-md  disabled:bg-gray-400 sm:text-sm ${row.error?.field === 'from' || row.error?.field === 'both' ? 'ring-2 ring-red-500 focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-red-500' : ''}`}
        />

        <input
          type="date"
          placeholder="Al"
          disabled={!row.from}
          min={row.from}
          value={row.to}
          onChange={(e) => updateRow(index, 'to', e.target.value)}
          className={`w-1/4 rounded-lg px-3 py-2 text-left shadow-md invalid:ring-2 invalid:ring-red-500 invalid:focus-visible:outline-none disabled:bg-gray-200 sm:text-sm ${row.error?.field === 'to' || row.error?.field === 'both' ? 'ring-2 ring-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500' : ''}`}
        />

        {/* Category listbox for Permanenza */}
        {type === 'Permanenza' && (
          <Listbox
            value={row.category}
            onChange={(value) => updateRow(index, 'category', value)}
          >
            <div className="relative w-1/4">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md  sm:text-sm">
                <span
                  className={`block truncate ${row.category ? '' : 'text-gray-400'}`}
                >
                  {row.category ?? 'Selezionare categoria'}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  {categories.map((category) => (
                    <Listbox.Option
                      className="relative cursor-default select-none py-2 pl-10 pr-4 ui-active:bg-amber-100 ui-active:text-amber-900"
                      key={category.id}
                      value={category.name}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {category.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        )}

        {/* Extra entrances input field for Entrate */}
        {type === 'Entrate' && (
          <input
            type="number"
            placeholder="Entrate Extra"
            min={1}
            value={row.extraEntrances ?? ''}
            onChange={(e) =>
              updateRow(index, 'extraEntrances', Number(e.target.value))
            }
            className={`w-1/4 rounded-lg bg-white px-3 py-2 text-left shadow-md invalid:ring-2 invalid:ring-red-500 invalid:focus-visible:outline-none disabled:bg-gray-200 sm:text-sm ${row.error?.field === 'extraEntrances' ? 'ring-2 ring-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500' : ''}`}
          />
        )}

        {type === 'Cabina privata' && <div className="w-1/4"></div>}

        {/* Add, clear and remove row buttons */}
        <div className="ml-1 flex w-[12.5%] flex-col items-center justify-start gap-2 sm:flex-row">
          {/* <button
            onClick={addRow}
            disabled={isDisabled(type, row)}
            className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 font-bold text-white shadow-md hover:bg-green-700 disabled:bg-gray-300"
            title="Aggiungi una riga"
          >
            <PlusIcon className="h-5 w-5" />
          </button> */}
          <button
            onClick={() => updateRow(index, 'clear', '')}
            disabled={!rowHasData(row)}
            className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 font-bold text-white shadow-md hover:bg-yellow-700 disabled:bg-gray-300"
            title="Pulisci questa riga"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          {index !== 0 && (
            <button
              onClick={() => removeRow(index)}
              className="inline-flex items-center rounded-lg bg-red-500 px-4 py-2 font-bold text-white shadow-md hover:bg-red-700"
              title="Rimuovi questa riga"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {row.error?.message && (
        <p className="text-red-500">{row.error.message}</p>
      )}
    </Fragment>
  )
}

export default DisclosureRow
