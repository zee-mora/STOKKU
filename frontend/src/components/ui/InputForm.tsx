interface InputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string | 'textarea' | 'text' | 'email' | 'tel' | 'password';
}

const InputForm: React.FC<InputFormProps> = ({
  label,
  disabled = false,
  className = '',
  required = false,
  placeholder,
  type = 'text',
  readOnly = false,
  ...rest
}) => {
  return (
    <div className="space-y-2">
      <label
        className={`text-sm font-semibold ${
          required ? 'required' : ''
        } ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
      >
        {label}
      </label>

      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`
          w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition-all
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500
          ${className}
        `}
        {...rest}
      />
    </div>
  );
};

export default InputForm;