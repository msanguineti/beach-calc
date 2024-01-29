'use client'

import { Tab } from '@headlessui/react'
import Calculator from './Calculator'

const tabs = [
  { id: 'calculator', name: 'Calcolatore' },
  { id: 'settings', name: 'Impostazioni' },
]

const Tabs = () => (
  <Tab.Group>
    <Tab.List className="bg-primary flex space-x-1 rounded-xl p-1">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          className="w-full rounded-lg bg-contrast py-2.5 font-semibold leading-5 text-white ring-tan ring-offset-2 ring-offset-accent hover:bg-ash_gray hover:text-white focus:outline-none focus:ring-2 ui-selected:bg-coffee ui-selected:text-white ui-selected:shadow"
        >
          {tab.name.toUpperCase()}
        </Tab>
      ))}
    </Tab.List>
    <Tab.Panels>
      <Tab.Panel>
        <Calculator />
      </Tab.Panel>
      <Tab.Panel>Content 2</Tab.Panel>
    </Tab.Panels>
  </Tab.Group>
)

export default Tabs
