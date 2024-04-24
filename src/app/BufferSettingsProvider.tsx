import React, { useState } from 'react'
import BufferSettingsContext from './BufferSettingsContext'
import { SettingsType } from './Settings'

function BufferSettingsProvider({
  children,
  initialSettings,
}: Readonly<{ children: React.ReactNode; initialSettings: SettingsType }>) {
  const [bufferSettings, setBufferSettings] = useState(initialSettings)

  return (
    <BufferSettingsContext.Provider value={[bufferSettings, setBufferSettings]}>
      {children}
    </BufferSettingsContext.Provider>
  )
}

export default BufferSettingsProvider
