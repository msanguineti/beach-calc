// Toaster.tsx
import { Transition } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { FC, Fragment, useEffect } from 'react'

type ToastType = 'danger' | 'warning' | 'info' | 'success'

// eslint-disable-next-line unicorn/prevent-abbreviations
interface ToasterProps {
  message: string
  type: ToastType
  visible: boolean
  onClose: () => void
  autoCloseTime?: number
}

export const Toaster: FC<ToasterProps> = ({
  message,
  type,
  visible,
  onClose,
  autoCloseTime = 3000,
}) => {
  const toastConfig = {
    danger: { color: 'bg-red-500', Icon: XCircleIcon },
    warning: { color: 'bg-yellow-500', Icon: ExclamationTriangleIcon },
    info: { color: 'bg-blue-500', Icon: InformationCircleIcon },
    success: { color: 'bg-green-500', Icon: CheckCircleIcon },
  }

  const { color, Icon } = toastConfig[type]

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseTime)

      return () => clearTimeout(timer)
    }
  }, [visible, onClose, autoCloseTime])

  return (
    // visible && (
    <Transition
      show={visible}
      as={Fragment}
      // enter="transition ease-out duration-300"
      // enterFrom="transform opacity-0 translate-y-2"
      // enterTo="transform opacity-100 translate-y-0"
      // leave="transition ease-in duration-100"
      // leaveFrom="transform opacity-100 translate-y-0"
      // leaveTo="transform opacity-0 translate-y-1"

      enter="transition ease-out duration-75"
      enterFrom="transform translate-x-full opacity-0"
      enterTo="transform translate-x-0 opacity-100"
      leave="transition ease-in duration-300"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div
        className={`fixed right-0 top-0 m-6 rounded p-4 ${color} flex items-center text-white`}
      >
        <Icon className="mr-2 h-6 w-6" />
        {message}
      </div>
    </Transition>
    // )
  )
}
