import { Listbox, Transition } from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { Fragment, useEffect } from 'react'
import Button from './Button'
import { SectionTitle } from './Calculator'
import { InputField } from './InputField'
import { SettingsType, defaultSettings, isValidSettings } from './Settings'

export type RowData = {
  id: number
  from?: string
  to?: string
  category?: string
  extraEntrances?: number
  error?: {
    message: string
    field: 'from' | 'to' | 'both' | 'extraEntrances'
  }
}

// eslint-disable-next-line unicorn/prevent-abbreviations
type DisclosureRowProps = {
  section: SectionTitle
  row: RowData
  index: number
  categories?: { id: string; name: string }[]
  updateRow: (
    index: number,
    field: keyof RowData | 'clear',
    value: string | number,
  ) => void
  removeRow: (index: number) => void
  minMax?: { from: string; to: string }
}

const rowHasData = (row: RowData) =>
  Object.entries(row).some(
    ([key, value]) =>
      !['id', 'fromInputType', 'toInputType'].includes(key) &&
      value !== null &&
      value !== '',
  )

const DisclosureRow: React.FC<DisclosureRowProps> = ({
  section,
  row,
  index,
  updateRow,
  removeRow,
  minMax,
}) => {
  const settings: SettingsType = JSON.parse(
    localStorage.getItem('bufferSettings') ?? JSON.stringify(defaultSettings),
  ) as SettingsType

  useEffect(() => {
    if (rowHasData(row) && !isValidSettings(settings)) {
      updateRow(index, 'clear', '')
    }
  }, [settings, row, index, updateRow])

  return (
    <Fragment>
      <div className="mt-2 flex items-center gap-2 last:mb-3">
        <InputField
          id="from"
          type="date"
          label="dal"
          value={row.from as string}
          width="w-1/4"
          onChange={(event) => updateRow(index, 'from', event.target.value)}
          props={{
            min:
              section === 'Permanenza'
                ? settings.periods[0].start
                : minMax?.from,
            disabled: !isValidSettings(settings),
            max: section === 'Permanenza' ? settings.closingDate : minMax?.to,
          }}
        />

        <InputField
          id="to"
          type="date"
          label="al"
          value={row.to as string}
          width="w-1/4"
          onChange={(event) => updateRow(index, 'to', event.target.value)}
          props={{
            min: row.from,
            disabled: !row.from,
            max: section === 'Permanenza' ? settings.closingDate : minMax?.to,
          }}
        />

        {/* Category listbox for Permanenza */}
        {section === 'Permanenza' && (
          <Listbox
            value={row.category}
            onChange={(value) => updateRow(index, 'category', value)}
            disabled={!row.from || settings.periods[0].categories.length === 0}
            as={'div'}
            className="relative flex w-1/4 flex-col rounded-lg bg-white p-2 shadow ui-disabled:bg-gray-200 ui-disabled:text-jet-800"
          >
            <label
              htmlFor="category"
              className={`${row.from ? 'text-jet-700' : ''} text-sm`}
            >
              categoria
            </label>
            <Listbox.Button
              id="category"
              className="relative w-full cursor-default pl-1 text-left text-base"
            >
              <span className={`block truncate`}>
                {row.category ? (
                  <>
                    {row.category}
                    <sup>a</sup>
                  </>
                ) : (
                  '...'
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute -left-0 z-20 mt-14 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-md ring-1 ring-black/5 focus:outline-none">
                {settings.periods[0].categories.map((category) => (
                  <Listbox.Option
                    className="relative cursor-default select-none py-2 pl-10 pr-4 ui-active:bg-amber-100 ui-active:text-amber-900"
                    key={category.id}
                    value={category.name}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate  ${
                            selected ? 'font-bold' : 'font-light'
                          }`}
                        >
                          {category.name}
                          <sup>a</sup>
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : undefined}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </Listbox>
        )}

        {/* Extra entrances input field for Entrate */}
        {section === 'Entrate' && (
          <InputField
            id="extraEntrances"
            type="number"
            label="entrate"
            value={row.extraEntrances ?? ''}
            width="w-1/4"
            onChange={(event) =>
              updateRow(index, 'extraEntrances', Number(event.target.value))
            }
            props={{
              min: 1,
              disabled: !row.from,
              placeholder: '...',
            }}
          />
        )}

        {section === 'Cabina privata' && <div className="w-1/4"></div>}

        {/* Add, clear and remove row buttons */}
        <div className="ml-1 flex w-[12.5%] flex-col items-center justify-start gap-2 sm:flex-row">
          <Button
            onClick={() => updateRow(index, 'clear', '')}
            disabled={!rowHasData(row)}
            color="yellow"
            title="Pulisci questa riga"
            Icon={ArrowPathIcon}
          />
          {index !== 0 && (
            <Button
              onClick={() => removeRow(index)}
              color="red"
              title="Rimuovi questa riga"
              Icon={TrashIcon}
            />
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
