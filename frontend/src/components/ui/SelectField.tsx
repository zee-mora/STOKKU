import Select, { type StylesConfig } from "react-select";

export interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  required?: boolean;
  options: Option[];
  value?: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

const selectStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 12,
    borderColor: state.isFocused ? "#10b981" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(16, 185, 129, 0.2)" : "none",
    backgroundColor: state.isDisabled ? "#f3f4f6" : "#ffffff",
    transition: "all 150ms ease",
    "&:hover": {
      borderColor: state.isFocused ? "#10b981" : "#9ca3af",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 14px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111827",
    fontWeight: 500,
  }),
  input: (base) => ({
    ...base,
    color: "#111827",
  }),
  menu: (base) => ({
    ...base,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
    zIndex: 20,
  }),
  menuList: (base) => ({
    ...base,
    padding: 8,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 10,
    padding: "10px 12px",
    backgroundColor: state.isSelected
      ? "#10b981"
      : state.isFocused
        ? "#ecfdf5"
        : "transparent",
    color: state.isSelected ? "#ffffff" : "#111827",
    fontWeight: state.isSelected ? 600 : 500,
    cursor: "pointer",
    "&:active": {
      backgroundColor: state.isSelected ? "#059669" : "#d1fae5",
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "#e5e7eb",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#10b981" : "#6b7280",
    padding: "0 12px",
    transition: "color 150ms ease",
    "&:hover": {
      color: "#059669",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#6b7280",
    padding: "0 10px",
    "&:hover": {
      color: "#374151",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "#6b7280",
    padding: "12px",
  }),
};

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  isClearable = true,
  isDisabled = false,
  error,
  helperText,
  className = "",
}) => {
  const hasError = Boolean(error);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <label className={`text-sm font-semibold ${hasError ? "text-red-600" : "text-gray-700"}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Select
        options={options}
        value={value}
        onChange={(val) => onChange(val)}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={selectStyles}
        className="text-sm"
        classNamePrefix="STOKKU-select"
      />

      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default SelectField;