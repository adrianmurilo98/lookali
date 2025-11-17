"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface BusinessHoursSelectorProps {
  value: Record<string, { enabled: boolean; from: string; to: string }>
  onChange: (value: Record<string, { enabled: boolean; from: string; to: string }>) => void
}

const DAYS = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

export function BusinessHoursSelector({ value, onChange }: BusinessHoursSelectorProps) {
  const handleToggle = (day: string, enabled: boolean) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        enabled,
      },
    })
  }

  const handleTimeChange = (day: string, field: "from" | "to", time: string) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: time,
      },
    })
  }

  return (
    <div className="space-y-4">
      {DAYS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <div className="flex items-center gap-3 w-40">
            <Switch checked={value[key]?.enabled || false} onCheckedChange={(checked) => handleToggle(key, checked)} />
            <Label className="text-sm font-normal">{label}</Label>
          </div>

          {value[key]?.enabled ? (
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">De</Label>
              <Input
                type="time"
                value={value[key]?.from || "09:00"}
                onChange={(e) => handleTimeChange(key, "from", e.target.value)}
                className="w-32"
              />
              <Label className="text-sm text-muted-foreground">Até</Label>
              <Input
                type="time"
                value={value[key]?.to || "18:00"}
                onChange={(e) => handleTimeChange(key, "to", e.target.value)}
                className="w-32"
              />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Fechado</span>
          )}
        </div>
      ))}
    </div>
  )
}
