'use client'

import { Tab } from '@headlessui/react'
import Calculator from './Calculator'
import Settings from './Settings'

const tabs = [
  { id: 'calculator', name: 'Conto' },
  { id: 'settings', name: 'Impostazioni' },
  // { id: 'about', name: 'About' },
]

const Tabs = () => (
  <Tab.Group as={'div'}>
    <Tab.List className="bg-primary mb-3 border-b-[1px] border-tan ">
      <nav className="-mb-[1px] flex space-x-6">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className=" truncate border-b-2 border-transparent px-3 py-2.5 text-lg font-semibold leading-5 text-tan hover:border-tan focus:outline-none ui-selected:border-coffee ui-selected:text-coffee ui-not-selected:hover:text-tan-400"
            title={`Clicca per accedere a ${tab.name}`}
          >
            {tab.name}
          </Tab>
        ))}
      </nav>
    </Tab.List>
    <Tab.Panels>
      <Tab.Panel>
        <Calculator />
      </Tab.Panel>
      <Tab.Panel>
        <Settings />
      </Tab.Panel>
      {/* <Tab.Panel>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-coffee">BAGNI MIRAMARE</h1>
          <p className="text-lg font-semibold text-tan">
            Made with ❤️ by GocciaSoft
          </p>
        </div>
      </Tab.Panel> */}
    </Tab.Panels>
  </Tab.Group>
)

export default Tabs
