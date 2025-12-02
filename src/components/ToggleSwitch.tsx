interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, label, id, disabled = false }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${checked ? 'bg-purple-600' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="sr-only">{label || 'Toggle'}</span>
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <label 
          htmlFor={id} 
          className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 cursor-pointer'}`}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
}
