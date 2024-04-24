import { Dispatch, createContext } from 'react'
import { SettingsType } from './Settings'

const BufferSettingsContext = createContext<
  [SettingsType, Dispatch<React.SetStateAction<SettingsType>>]
>([{} as SettingsType, () => {}])

export default BufferSettingsContext
