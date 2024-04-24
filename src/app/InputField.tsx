// eslint-disable-next-line unicorn/prevent-abbreviations
export type InputFieldProps = {
  id: string
  type: string
  label: string | React.ReactNode
  value: string | number
  width: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  props?: Record<string, unknown>
}

export const InputField = ({
  id,
  type,
  label,
  value,
  width,
  onChange,
  onBlur,
  props,
}: InputFieldProps) => (
  <div
    className={`flex ${width} flex-col rounded-lg bg-white p-2 text-sm shadow has-[:disabled]:bg-gray-200 has-[:invalid]:bg-red-300 has-[:disabled]:text-jet-800`}
  >
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="bg-inherit text-base outline-none disabled:cursor-not-allowed"
      {...props}
    />
  </div>
)
