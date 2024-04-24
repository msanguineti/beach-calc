import { Dispatch, createContext } from 'react'
import { RowData } from './DisclosureRow'
import { SettingsType } from './Settings'

export type StateType = {
  settings: SettingsType
  total: number
  breakdown: Record<string, any>
  minMax: { from: string; to: string; sorted: RowData[] }
  rows: Record<string, RowData[]>
}

const StateContext = createContext<
  [StateType, Dispatch<React.SetStateAction<StateType>>]
>([
  {
    settings: {
      periods: [],
      priceEntrance: 0,
      priceBooth: 0,
      closingDate: '',
      priceDiscount: 0,
      daysNoDiscount: 0,
    },
    total: 0,
    breakdown: {},
    minMax: {
      from: '',
      to: '',
      sorted: [],
    },
    rows: {},
  },
  () => {},
])

export default StateContext
