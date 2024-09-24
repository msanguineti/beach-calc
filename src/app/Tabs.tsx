'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import Image from 'next/image'
import Calculator from './Calculator'
import Settings from './Settings'
import Bash from './assets/images/bash2.avif'

const tabs = [
  { id: 'calculator', name: 'Conto' },
  { id: 'settings', name: 'Impostazioni' },
  { id: 'about', name: 'Informazioni' },
]

const Tabs = () => (
  <TabGroup as={'div'}>
    <TabList className="bg-primary mb-3 border-b-[1px] border-tan">
      <nav className="-mb-[1px] flex space-x-6">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className="truncate border-b-2 border-transparent px-3 py-2.5 text-lg font-semibold leading-5 text-tan hover:border-tan focus:outline-none ui-selected:border-coffee ui-selected:text-coffee ui-not-selected:hover:text-tan-400"
            title={`Clicca per accedere a ${tab.name}`}
          >
            {tab.name}
          </Tab>
        ))}
      </nav>
    </TabList>
    <TabPanels>
      <TabPanel>
        <Calculator />
      </TabPanel>
      <TabPanel>
        <Settings />
      </TabPanel>
      <TabPanel>
        <div className="flex flex-col items-center justify-center p-2">
          <Image src={Bash} alt="Bash" width={256} height={256} />
        </div>
      </TabPanel>
    </TabPanels>
  </TabGroup>
)

export default Tabs
