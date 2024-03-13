'use client'

import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { useLocalStorage } from '@uidotdev/usehooks'
import { fileOpen, fileSave } from 'browser-fs-access'
import { useState } from 'react'
import Button from './Button'
import { Dialog as MyDialog } from './Dialog'
import { InputField } from './InputField'
import { Toaster } from './Toaster'

export type Category = { id: number; name: string; price: number }

export type Period = { id: number; start: string; categories: Category[] }

export type SettingsType = {
  periods: Period[]
  priceEntrance: number
  priceBooth: number
  closingDate: string
  priceDiscount: number
  daysNoDiscount: number
}

export const defaultSettings: SettingsType = {
  periods: [{ id: 0, start: '', categories: [{ id: 0, name: '1', price: 0 }] }],
  priceEntrance: 0,
  priceBooth: 0,
  closingDate: '',
  priceDiscount: 5,
  daysNoDiscount: 15,
}

export const isValidSettings = (settings: SettingsType) =>
  settings.priceBooth > 0 &&
  settings.priceEntrance > 0 &&
  settings.closingDate !== '' &&
  settings.periods.length > 0 &&
  settings.periods.every(
    (period) =>
      period.start &&
      period.categories.length > 0 &&
      period.categories.every(
        (category) => category.name && category.price > 0,
      ),
  )

const inputFieldData: {
  id: string
  type: string
  label: string
  width: string
  props?: Record<string, unknown>
}[] = [
  {
    id: 'closingDate',
    type: 'date',
    label: 'data chiusura',
    width: 'w-40',
  },
  {
    id: 'totCategories',
    type: 'number',
    label: 'categorie',
    width: 'max-w-[76px]',
    props: { min: 1, placeholder: '...' },
  },
  {
    id: 'totPeriods',
    type: 'number',
    label: 'periodi',
    width: 'max-w-[76px]',
    props: { min: 1, placeholder: '...' },
  },
  {
    id: 'price-entrance',
    type: 'number',
    label: 'entrata',
    width: 'max-w-[76px]',
    props: { min: 0, step: 0.5, placeholder: '€' },
  },
  {
    id: 'price-booth',
    type: 'number',
    label: 'cabina',
    width: 'max-w-[76px]',
    props: { min: 0, step: 0.5, placeholder: '€' },
  },
  {
    id: 'price-discount',
    type: 'number',
    label: 'sconto',
    width: 'max-w-[76px]',
    props: { min: 0, step: 0.5, placeholder: '€' },
  },
  {
    id: 'days-no-discount',
    type: 'number',
    label: 'gg senza sconto',
    width: 'w-32',
    props: { min: 0, step: 1, placeholder: '...' },
  },
]

const buttonConfigs: {
  id: number
  color: string
  title: string
  Icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string
      titleId?: string
    } & React.RefAttributes<SVGSVGElement>
  >
}[] = [
  {
    id: 0,
    color: 'yellow',
    title: 'Annulla le modifiche',
    Icon: ArrowPathIcon,
  },
  {
    id: 1,
    color: 'red',
    title: 'Rispistina le impostazioni iniziali',
    Icon: TrashIcon,
  },
  {
    id: 2,
    color: 'green',
    title: 'Salva le impostazioni',
    Icon: DocumentArrowUpIcon,
  },
  {
    id: 3,
    color: 'blue',
    title: 'Carica le impostazioni',
    Icon: DocumentArrowDownIcon,
  },
]

const getPreviousPeriodStart = (index: number, periods: Period[]) => {
  if (index === 0) return ''

  const { start: previousPeriodStart } = periods[index - 1]
  try {
    const previousDate = new Date(previousPeriodStart)
    previousDate.setDate(previousDate.getDate() + 1)

    return previousDate.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

const Settings = () => {
  const [settings, setSettings] = useLocalStorage<SettingsType>(
    'settings',
    defaultSettings,
  )

  const [bufferSettings, setBufferSettings] = useLocalStorage<SettingsType>(
    'bufferSettings',
    settings,
  )

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const [toast, setToast] = useState<{
    message: string
    type: 'danger' | 'warning' | 'info' | 'success'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  const handleOpen = async () => {
    const file = await fileOpen({
      description: 'Carica le impostazioni',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
      startIn: 'documents',
    })

    if (!file) return

    const fileContents = await file.text()
    const settings = JSON.parse(fileContents)
    setSettings(settings)
    setBufferSettings(settings)

    setToast({
      message: 'Le impostazioni sono state caricate',
      type: 'success',
      visible: true,
    })
  }

  const handleSave = async () => {
    setSettings(bufferSettings)

    const blob = new Blob([JSON.stringify(bufferSettings)], {
      type: 'application/json',
    })
    await fileSave(blob, {
      fileName: `impostazioni-${new Date(Date.now()).toISOString().split('T')[0]}.json`,
      extensions: ['.json'],
      mimeTypes: ['application/json'],
      description: 'Salva le impostazioni',
      startIn: 'documents',
    })

    setToast({
      message: 'Le impostazioni sono state salvate',
      type: 'success',
      visible: true,
    })
  }

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Number(event.target.value)

    setBufferSettings((oldSettings) => {
      const newSettings = { ...oldSettings }
      const newPeriods = [...oldSettings.periods]
      if (newCount > oldSettings.periods[0].categories.length) {
        // Add new categories
        for (
          let index = oldSettings.periods[0].categories.length;
          index < newCount;
          index++
        ) {
          newPeriods.map((period) => {
            period.categories.push({
              id: index,
              name: `${index + 1}`,
              price: 0,
            })
          })
        }
      } else if (newCount < oldSettings.periods[0].categories.length) {
        // Remove categories
        // newPeriods[0].categories.splice(newCount)
        newPeriods.map((period) => {
          period.categories.splice(newCount)
        })
      }
      newSettings.periods = newPeriods
      return newSettings
    })
  }

  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Number(event.target.value)

    setBufferSettings((oldSettings) => {
      const newSettings = { ...oldSettings }
      const newPeriods = [...oldSettings.periods]
      if (newCount > oldSettings.periods.length) {
        //if the last period has a start date, and this start date is <= than the closing date, then add a new period
        const lastPeriod = oldSettings.periods.at(-1) as Period
        const lastPeriodStartDate = new Date(lastPeriod.start)
        const closingDate = new Date(oldSettings.closingDate)
        if (lastPeriod.start === '' || lastPeriodStartDate >= closingDate)
          return oldSettings

        // Add new periods
        for (
          let index = oldSettings.periods.length;
          index < newCount;
          index++
        ) {
          newPeriods.push({
            id: index,
            start: '',
            categories: oldSettings.periods[0].categories.map((category) => ({
              id: category.id,
              name: category.name,
              price: 0,
            })),
          })
        }
      } else if (newCount < oldSettings.periods.length) {
        // Remove periods
        newPeriods.splice(newCount)
      }
      newSettings.periods = newPeriods
      return newSettings
    })
  }

  // const handlePriceEntranceChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     newSettings.priceEntrance = Number(event.target.value)
  //     return newSettings
  //   })
  // }

  // const handlePriceBoothChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     newSettings.priceBooth = Number(event.target.value)
  //     return newSettings
  //   })
  // }

  // const handlePriceDiscountChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     newSettings.priceDiscount = Number(event.target.value)
  //     return newSettings
  //   })
  // }

  // const handleDaysNoDiscountChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     newSettings.daysNoDiscount = Number(event.target.value)
  //     return newSettings
  //   })
  // }

  // const handleClosingDateChange = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  // ) => {
  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     newSettings.closingDate = event.target.value
  //     return newSettings
  //   })
  // }

  const handleSimpleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof SettingsType,
  ) => {
    setBufferSettings((oldSettings) => {
      const newSettings: SettingsType = { ...oldSettings }
      newSettings[field] = event.target.value as never
      return newSettings
    })
  }

  const handlePeriodStartChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    setBufferSettings((oldSettings) => {
      const newSettings = { ...oldSettings }
      const newPeriods = [...oldSettings.periods]
      newPeriods[index].start = event.target.value
      newSettings.periods = newPeriods
      return newSettings
    })
  }

  const handleCategoryPriceChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    periodIndex: number,
    categoryIndex: number,
  ) => {
    const newPrice = Number(event.target.value)

    setBufferSettings((oldSettings) => {
      const newSettings = { ...oldSettings }
      const newPeriods = [...oldSettings.periods]
      newPeriods[periodIndex].categories[categoryIndex].price = newPrice
      newSettings.periods = newPeriods
      return newSettings
    })
  }

  const openResetDialog = () => {
    setIsResetDialogOpen(true)
  }

  const closeResetDialog = () => {
    setIsResetDialogOpen(false)
  }

  const resetAllSettings = () => {
    setSettings(defaultSettings)
    setBufferSettings(defaultSettings)
    closeResetDialog()
  }

  const isBufferDifferentFrom = (other: SettingsType) =>
    JSON.stringify(bufferSettings) !== JSON.stringify(other)

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {inputFieldData.map((field) => {
            let value
            let onChange

            switch (field.id) {
              case 'closingDate': {
                value = bufferSettings.closingDate
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleSimpleChange(event, 'closingDate')

                break
              }
              case 'totCategories': {
                value = bufferSettings.periods[0].categories.length ?? ''
                onChange = handleCategoryChange
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }

                break
              }
              case 'totPeriods': {
                value = bufferSettings.periods.length ?? ''
                onChange = handlePeriodChange
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }
                break
              }
              case 'price-entrance': {
                value =
                  bufferSettings.priceEntrance > 0
                    ? Number(bufferSettings.priceEntrance).toFixed(2)
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleSimpleChange(event, 'priceEntrance')
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }

                break
              }
              case 'price-booth': {
                value =
                  bufferSettings.priceBooth > 0
                    ? Number(bufferSettings.priceBooth).toFixed(2)
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleSimpleChange(event, 'priceBooth')
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }

                break
              }
              case 'price-discount': {
                value =
                  bufferSettings.priceDiscount > 0
                    ? Number(bufferSettings.priceDiscount).toFixed(2)
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleSimpleChange(event, 'priceDiscount')
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }

                break
              }
              case 'days-no-discount': {
                value =
                  bufferSettings.daysNoDiscount > 0
                    ? bufferSettings.daysNoDiscount
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleSimpleChange(event, 'daysNoDiscount')
                field.props = {
                  ...field.props,
                  disabled: !bufferSettings.closingDate,
                }

                break
              }
              default: {
                break
              }
            }

            return (
              <InputField
                key={field.id}
                id={field.id}
                type={field.type}
                label={field.label}
                value={value as string | number}
                width={field.width}
                onChange={
                  onChange as (
                    event: React.ChangeEvent<HTMLInputElement>,
                  ) => void
                }
                props={field.props}
              />
            )
          })}
        </div>

        <div className="mt-4 flex gap-2  pb-4">
          {bufferSettings.periods.map(({ id, categories, start }) => (
            <div key={id} className="flex max-w-40 flex-col gap-2">
              <InputField
                id="from"
                type="date"
                label={`Inizio ${id + 1}° periodo`}
                value={start}
                width="w-full"
                onChange={(event) => handlePeriodStartChange(event, id)}
                props={{
                  min: getPreviousPeriodStart(id, bufferSettings.periods),
                  disabled: !bufferSettings.closingDate,
                  max: bufferSettings.closingDate,
                }}
              />
              {categories.map((category) => (
                <InputField
                  key={category.id}
                  id={`category-${category.name}`}
                  type="number"
                  label={`${category.name}ª categoria`}
                  value={category.price > 0 ? category.price.toFixed(2) : ''}
                  width="w-full"
                  onChange={(event) =>
                    handleCategoryPriceChange(event, id, category.id)
                  }
                  props={{
                    min: 0,
                    step: 0.5,
                    disabled: !start || !bufferSettings.closingDate,
                    placeholder: '€',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t-[1px] border-tan pt-2">
        {buttonConfigs.map((config, index) => {
          let onClick
          let disabled

          switch (index) {
            case 0: {
              onClick = () => setBufferSettings(settings)
              disabled = !isBufferDifferentFrom(settings)
              break
            }
            case 1: {
              onClick = openResetDialog
              disabled = !isBufferDifferentFrom(defaultSettings)
              break
            }
            case 2: {
              onClick = () => handleSave()
              disabled = !(
                isBufferDifferentFrom(settings) &&
                isValidSettings(bufferSettings)
              )
              break
            }
            case 3: {
              onClick = () => handleOpen()
              break
            }
          }

          return (
            <Button
              key={config.id}
              onClick={onClick as () => void}
              color={config.color}
              disabled={disabled}
              title={config.title}
              Icon={config.Icon}
            />
          )
        })}
      </div>

      <Toaster
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      <MyDialog
        title="Ripristina impostazioni"
        description="Sei sicuro di voler ripristinare le impostazioni ai valori iniziali di default? Questa azione è irreversibile. Tutti i dati precedentemente salvati verranno persi."
        confirmText="Sì, ripristina"
        cancelText="No, annulla"
        onConfirm={() => resetAllSettings()}
        onCancel={closeResetDialog}
        isOpen={isResetDialogOpen}
      />
    </>
  )
}

export default Settings
