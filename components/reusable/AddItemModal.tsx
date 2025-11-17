"use client"

import type React from "react"
import { useState } from "react"

interface AddItemModalProps {
  title: string
  label?: string
  placeholder?: string
  onSave: (value: string, ...args: any[]) => void
  onClose: () => void
  dropdownLabel?: string
  dropdownOptions?: string[]
  dropdownValue?: string
  onDropdownChange?: (value: string) => void
  type?: string
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  title,
  label,
  placeholder,
  onSave,
  onClose,
  dropdownLabel,
  dropdownOptions,
  dropdownValue,
  onDropdownChange,
  type,
}) => {
  const [value, setValue] = useState("")
  const [promoName, setPromoName] = useState("")
  const [promoType, setPromoType] = useState<"percentage" | "fixed">("percentage")
  const [promoValue, setPromoValue] = useState(0)

  const handleSave = () => {
    if (type === "promotion") {
      onSave({ name: promoName, type: promoType, value: promoValue })
    } else if (dropdownValue) {
      onSave(value, dropdownValue)
    } else {
      onSave(value)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-brand-dark dark:text-dark-heading mb-4">{title}</h2>

        {type === "promotion" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">
                Nome da Promoção
              </label>
              <input
                type="text"
                value={promoName}
                onChange={(e) => setPromoName(e.target.value)}
                className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">
                Tipo de Desconto
              </label>
              <select
                value={promoType}
                onChange={(e) => setPromoType(e.target.value as "percentage" | "fixed")}
                className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">
                Valor do Desconto
              </label>
              <input
                type="number"
                value={promoValue}
                onChange={(e) => setPromoValue(Number(e.target.value))}
                className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dropdownLabel && dropdownOptions && onDropdownChange && (
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">
                  {dropdownLabel}
                </label>
                <select
                  value={dropdownValue}
                  onChange={(e) => onDropdownChange(e.target.value)}
                  className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm"
                >
                  {dropdownOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border text-brand-dark dark:text-dark-heading rounded-lg py-2 px-4 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-dark text-white rounded-lg py-2 px-4 text-sm font-semibold"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddItemModal
