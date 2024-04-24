'use client'

import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { fileOpen, fileSave } from 'browser-fs-access'
import { useContext, useState } from 'react'
import Button from './Button'
import { Dialog as MyDialog } from './Dialog'
import { InputField } from './InputField'
import StateContext from './StateContext'
import { Toaster } from './Toaster'
import { formatDate, stringToDate, stringToNumber } from './utilities'

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
  Number(settings.priceEntrance) >= 0 &&
  settings.closingDate !== '' &&
  settings.periods.length > 0 &&
  settings.periods.every(
    (period) =>
      period.start &&
      period.categories.length > 0 &&
      period.categories.every(
        (category) => category.name && category.price > 0,
      ),
  ) &&
  settings.priceDiscount > 0 &&
  settings.daysNoDiscount > 0

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
    props: { title: 'Inserisci la data di chiusura' },
  },
  {
    id: 'totCategories',
    type: 'number',
    label: 'categorie',
    width: 'max-w-[76px]',

    props: {
      min: 1,
      placeholder: '...',
      title: 'Inserisci il numero di categorie',
    },
  },
  {
    id: 'totPeriods',
    type: 'number',
    label: 'periodi',
    width: 'max-w-[76px]',
    props: {
      title: 'Inserisci il numero di periodi',
      min: 1,
      placeholder: '...',
    },
  },
  {
    id: 'price-entrance',
    type: 'text',
    label: 'entrata',
    width: 'max-w-[76px]',
    props: {
      title: 'Inserisci il prezzo di entrata extra',
      pattern: '\\d+([,\\.]{1}\\d*)?',
      placeholder: '€',
    },
  },
  {
    id: 'price-booth',
    type: 'number',
    label: 'cabina',
    width: 'max-w-[76px]',
    props: {
      title: 'Inserisci il prezzo della cabina privata',
      min: 0,
      placeholder: '€',
    },
  },
  {
    id: 'price-discount',
    type: 'number',
    label: 'sconto',
    width: 'max-w-[76px]',
    props: {
      title: 'Inserisci lo sconto giornaliero',
      min: 0,
      placeholder: '€',
    },
  },
  {
    id: 'days-no-discount',
    type: 'number',
    label: 'gg senza sconto',
    width: 'w-32',
    props: {
      title: 'Inserisci il numero di giorni senza sconto',
      min: 0,
      placeholder: '...',
    },
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

  const previousDate = stringToDate(previousPeriodStart)
  if (!previousDate) return ''
  previousDate.setDate(previousDate.getDate() + 1)
  return formatDate(previousDate)
}

const getNextPeriodStartOrClosingDate = (
  index: number,
  settings: SettingsType,
) => {
  const { start: nextPeriodStart } = settings.periods[index + 1] ?? {}
  const { closingDate } = settings

  if (!nextPeriodStart) return closingDate

  const nextDate = stringToDate(nextPeriodStart) as Date
  nextDate.setDate(nextDate.getDate() - 1)

  return nextDate < (stringToDate(closingDate) as Date)
    ? formatDate(nextDate)
    : closingDate
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings)

  const [state, setState] = useContext(StateContext)

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
    // setBufferSettings(settings)
    setState((oldState) => {
      const newState = { ...oldState }
      newState.settings = settings
      return newState
    })

    setToast({
      message: 'Le impostazioni sono state caricate',
      type: 'success',
      visible: true,
    })
  }

  const handleSave = async () => {
    setSettings(state.settings)

    const blob = new Blob([JSON.stringify(state.settings)], {
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

  // const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newCount = Number(
  //     event.target.value || defaultSettings.periods[0].categories.length,
  //   )

  //   if (newCount < 1) return

  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     const newPeriods = [...oldSettings.periods]
  //     if (newCount > oldSettings.periods[0].categories.length) {
  //       // Add new categories
  //       for (
  //         let index = oldSettings.periods[0].categories.length;
  //         index < newCount;
  //         index++
  //       ) {
  //         newPeriods.map((period) => {
  //           period.categories.push({
  //             id: index,
  //             name: `${index + 1}`,
  //             price: 0,
  //           })
  //         })
  //       }
  //     } else if (newCount < oldSettings.periods[0].categories.length) {
  //       // Remove categories
  //       // newPeriods[0].categories.splice(newCount)
  //       newPeriods.map((period) => {
  //         period.categories.splice(newCount)
  //       })
  //     }
  //     newSettings.periods = newPeriods
  //     return newSettings
  //   })
  // }

  // const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newCount = Number(
  //     event.target.value || defaultSettings.periods.length,
  //   )

  //   if (newCount < 1) return

  //   setBufferSettings((oldSettings) => {
  //     const newSettings = { ...oldSettings }
  //     const newPeriods = [...oldSettings.periods]
  //     if (newCount > oldSettings.periods.length) {
  //       //if the last period has a start date, and this start date is <= than the closing date, then add a new period
  //       const lastPeriod = oldSettings.periods.at(-1) as Period
  //       const lastPeriodStartDate = new Date(lastPeriod.start)
  //       const closingDate = new Date(oldSettings.closingDate)
  //       if (lastPeriod.start === '' || lastPeriodStartDate >= closingDate)
  //         return oldSettings

  //       // Add new periods
  //       for (
  //         let index = oldSettings.periods.length;
  //         index < newCount;
  //         index++
  //       ) {
  //         newPeriods.push({
  //           id: index,
  //           start: '',
  //           categories: oldSettings.periods[0].categories.map((category) => ({
  //             id: category.id,
  //             name: category.name,
  //             price: 0,
  //           })),
  //         })
  //       }
  //     } else if (newCount < oldSettings.periods.length) {
  //       // Remove periods
  //       newPeriods.splice(newCount)
  //     }
  //     newSettings.periods = newPeriods
  //     return newSettings
  //   })
  // }

  const handlePeriodStartChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    periodsIndex: number,
  ) => {
    const value = event.target.value || ''
    if (value === '') return

    // if the start date is empty, return the old settings
    // if the start date is <= than the closing date, return the old settings
    const startDate = new Date(value)
    const previousDate = new Date(
      getPreviousPeriodStart(periodsIndex, state.settings.periods),
    )
    const closingDate = new Date(
      getNextPeriodStartOrClosingDate(periodsIndex, state.settings),
    )

    if (Number.isNaN(startDate.getTime())) return

    if (startDate < previousDate || startDate > closingDate) return

    // Handle period start change
    setState((oldState) => {
      const newState = { ...oldState }
      const newSettings = { ...oldState.settings }
      const newPeriods = [...newSettings.periods]
      newPeriods[periodsIndex].start = value
      newSettings.periods = newPeriods
      newState.settings = newSettings
      return newState
    })
  }

  const handleInputChange = ({
    event,
    field,
    periodsIndex,
    categoriesIndex,
  }: {
    event: React.ChangeEvent<HTMLInputElement>
    field?: keyof SettingsType
    periodsIndex?: number
    categoriesIndex?: number
  }) => {
    setState((oldState) => {
      const newState = { ...oldState }
      const newSettings = { ...oldState.settings }
      const newPeriods = [...newSettings.periods]
      if (periodsIndex !== undefined && categoriesIndex !== undefined) {
        // Handle category price change
        const newPrice = Number(event.target.value || 0)

        if (newPrice < 0) return oldState

        newPeriods[periodsIndex].categories[categoriesIndex].price = newPrice
      } else if (field) {
        // if field is not closingDate, then the value must be a positive number
        if (field !== 'closingDate') {
          const value = Number(event.target.value)
          if (value < 0) return oldState
        }

        newSettings[field] = event.target.value as never
      }
      newSettings.periods = newPeriods
      newState.settings = newSettings
      return newState
    })
  }

  const openResetDialog = () => {
    setIsResetDialogOpen(true)
  }

  const closeResetDialog = () => {
    setIsResetDialogOpen(false)
  }

  const resetAllSettings = () => {
    console.log('🚀 ~ resetAllSettings ~ defaultSettings:', defaultSettings)
    setSettings(defaultSettings)
    setState((oldState) => {
      return {
        ...oldState,
        settings: defaultSettings,
      }
    })
    closeResetDialog()
  }

  const isBufferDifferentFrom = (other: SettingsType) =>
    JSON.stringify(state.settings) !== JSON.stringify(other)

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {inputFieldData.map((field) => {
            let value
            let onChange
            let onBlur

            switch (field.id) {
              case 'closingDate': {
                value = state.settings.closingDate
                onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                  setState((oldState) => {
                    const newClosingDate = stringToDate(event.target.value)
                    if (!newClosingDate) {
                      setToast({
                        message: 'Inserisci una data valida',
                        type: 'warning',
                        visible: true,
                      })
                      return oldState
                    }
                    return {
                      ...oldState,
                      settings: {
                        ...oldState.settings,
                        closingDate: formatDate(newClosingDate),
                      },
                    }
                  })
                }

                break
              }
              case 'totCategories': {
                value = state.settings.periods[0].categories.length ?? ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                  setState((oldState) => {
                    const newPeriods = [...oldState.settings.periods]
                    const newCategoryCount = stringToNumber(event.target.value)
                    if (
                      Number.isNaN(newCategoryCount) ||
                      newCategoryCount < 1
                    ) {
                      setToast({
                        message: 'Inserisci un numero valido',
                        type: 'warning',
                        visible: true,
                      })
                      return oldState
                    }
                    if (
                      newCategoryCount >
                      oldState.settings.periods[0].categories.length
                    ) {
                      // Add new categories
                      for (
                        let index =
                          oldState.settings.periods[0].categories.length;
                        index < newCategoryCount;
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
                    } else if (
                      newCategoryCount <
                      oldState.settings.periods[0].categories.length
                    ) {
                      newPeriods.map((period) => {
                        period.categories.splice(newCategoryCount)
                      })
                    }
                    return {
                      ...oldState,
                      settings: {
                        ...oldState.settings,
                        periods: newPeriods,
                      },
                    }
                  })
                }
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
                }

                break
              }
              case 'totPeriods': {
                value = state.settings.periods.length ?? ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                  setState((oldState) => {
                    const newPeriods = [...oldState.settings.periods]
                    const newPeriodsCount = stringToNumber(event.target.value)
                    if (Number.isNaN(newPeriodsCount) || newPeriodsCount < 1) {
                      setToast({
                        message: 'Inserisci un numero valido',
                        type: 'warning',
                        visible: true,
                      })
                      return oldState
                    }
                    if (newPeriodsCount > oldState.settings.periods.length) {
                      // Add new periods
                      for (
                        let index = oldState.settings.periods.length;
                        index < newPeriodsCount;
                        index++
                      ) {
                        const lastPeriod = oldState.settings.periods.at(
                          -1,
                        ) as Period
                        const lastPeriodStartDate = new Date(lastPeriod.start)
                        const closingDate = new Date(
                          oldState.settings.closingDate,
                        )
                        if (lastPeriod.start === '') {
                          setToast({
                            message:
                              "Inserisci una data di inizio per l'ultimo periodo",
                            type: 'warning',
                            visible: true,
                          })
                          return oldState
                        } else if (lastPeriodStartDate >= closingDate) {
                          setToast({
                            message:
                              "La data di inizio dell'ultimo periodo deve essere minore della data di chiusura",
                            type: 'warning',
                            visible: true,
                          })
                          return oldState
                        }
                        newPeriods.push({
                          id: index,
                          start: '',
                          categories:
                            oldState.settings.periods[0].categories.map(
                              (category) => ({
                                id: category.id,
                                name: category.name,
                                price: 0,
                              }),
                            ),
                        })
                      }
                    } else if (
                      newPeriodsCount < oldState.settings.periods.length
                    ) {
                      newPeriods.splice(newPeriodsCount)
                    }
                    return {
                      ...oldState,
                      settings: {
                        ...oldState.settings,
                        periods: newPeriods,
                      },
                    }
                  })
                }
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
                }
                break
              }
              case 'price-entrance': {
                value = settings.priceEntrance ?? ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                  setSettings((oldSettings) => {
                    return {
                      ...oldSettings,
                      priceEntrance: event.target.value as never,
                    }
                  })
                }
                onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
                  console.log('🚀 ~ {inputFieldData.map ~ event:', event)

                  const newPriceEntrance = stringToNumber(
                    event.target.value,
                  )

                  if(Number.isNaN(newPriceEntrance) || newPriceEntrance < 0) {
                    setToast({
                      message: 'Inserisci un prezzo valido',
                      type: 'danger',
                      visible: true,
                    })
                    return
                  }

                  setState((oldState) => {
                    return {
                      ...oldState,
                      settings: {
                        ...oldState.settings,
                        priceEntrance: newPriceEntrance,
                      },
                    }
                  })

                  setSettings((oldSettings) => {
                    return {
                      ...oldSettings,
                      priceEntrance: Number.parseFloat(
                        newPriceEntrance.toFixed(2),
                      ),
                    }
                  })


                }
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
                }

                break
              }
              case 'price-booth': {
                value =
                  state.settings.priceBooth > 0
                    ? Number(state.settings.priceBooth).toFixed(2)
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange({ event, field: 'priceBooth' })
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
                }

                break
              }
              case 'price-discount': {
                value =
                  state.settings.priceDiscount >= 0
                    ? Number(state.settings.priceDiscount).toFixed(2)
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange({ event, field: 'priceDiscount' })
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
                }

                break
              }
              case 'days-no-discount': {
                value =
                  state.settings.daysNoDiscount >= 0
                    ? state.settings.daysNoDiscount
                    : ''
                onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange({ event, field: 'daysNoDiscount' })
                field.props = {
                  ...field.props,
                  disabled: !state.settings.closingDate,
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
                onBlur={
                  onBlur as (event: React.FocusEvent<HTMLInputElement>) => void
                }
                props={field.props}
              />
            )
          })}
        </div>

        <div className="mt-4 flex gap-2  pb-4">
          {state.settings.periods.map(({ id, categories, start }) => (
            <div key={id} className="flex max-w-40 flex-col gap-2">
              <InputField
                id="from"
                type="date"
                label={`Inizio ${id + 1}° periodo`}
                value={start}
                width="w-full"
                onChange={(event) => handlePeriodStartChange(event, id)}
                props={{
                  min: getPreviousPeriodStart(id, state.settings.periods),
                  disabled: !state.settings.closingDate,
                  max: getNextPeriodStartOrClosingDate(id, state.settings),
                  title: `Inserisci la data di inizio del ${id + 1}° periodo`,
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
                    handleInputChange({
                      event,
                      periodsIndex: id,
                      categoriesIndex: category.id,
                    })
                  }
                  props={{
                    min: 0,
                    step: 0.5,
                    disabled: !start || !state.settings.closingDate,
                    placeholder: '€',
                    title: `Inserisci il prezzo della ${category.name}ª categoria`,
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
              // onClick = () => setBufferSettings(settings)
              onClick = () =>
                setState((oldState) => {
                  const newState = { ...oldState }
                  newState.settings = { ...settings }
                  return newState
                })
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
                isValidSettings(state.settings)
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
