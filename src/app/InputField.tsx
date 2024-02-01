// eslint-disable-next-line unicorn/prevent-abbreviations
export type InputFieldsProps = {
  id: string
  type: string
  label: string | React.ReactNode
  value: string | number
  width: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  props?: Record<string, unknown>
}

export const InputField = ({
  id,
  type,
  label,
  value,
  width,
  onChange,
  props,
}: InputFieldsProps) => (
  <div
    className={`flex ${width} flex-col rounded-lg p-2 text-sm shadow ${props?.disabled ? 'bg-gray-200 text-jet-800' : 'bg-white'}`}
  >
    <label htmlFor={id} className={`${props?.disabled ? '' : 'text-jet-700'}`}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className="bg-inherit text-base outline-none"
      {...props}
    />
  </div>
)
