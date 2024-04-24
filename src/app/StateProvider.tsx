'use client'

import React, { useState } from 'react'
import StateContext, { StateType } from './StateContext'

function StateProvider({
  children,
  initialState,
}: Readonly<{ children: React.ReactNode; initialState: StateType }>) {
  const [state, setState] = useState(initialState)

  return (
    <StateContext.Provider value={[state, setState]}>
      {children}
    </StateContext.Provider>
  )
}

export default StateProvider
