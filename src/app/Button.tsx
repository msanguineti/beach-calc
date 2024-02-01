// eslint-disable-next-line unicorn/prevent-abbreviations
interface ButtonProps {
  onClick: () => void
  color: string
  disabled?: boolean
  title: string
  Icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string
      titleId?: string
    } & React.RefAttributes<SVGSVGElement>
  >
  text?: string
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  color,
  disabled,
  title,
  Icon,
  text,
}) => {
  const baseClasses =
    'rounded-lg px-4 py-2 text-white shadow-md focus:outline-none focus-visible:ring focus-visible:ring-accent disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-jet-800'
  const colorClasses = {
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    red: 'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  }[color]

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorClasses}`}
      disabled={disabled}
      title={title}
    >
      {Icon && <Icon className={`h-5 w-5 ${text && 'mr-2'}`} />}
      {text}
    </button>
  )
}

export default Button
