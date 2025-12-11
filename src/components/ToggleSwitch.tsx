import { Switch, Typography } from 'antd';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, label, id, disabled = false }: ToggleSwitchProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id={id} checked={checked} onChange={onChange} disabled={disabled} />
      {label && (
        <Typography.Text type={disabled ? 'secondary' : undefined} onClick={() => !disabled && onChange(!checked)} style={{ cursor: disabled ? 'default' : 'pointer' }}>
          {label}
        </Typography.Text>
      )}
    </div>
  );
}
