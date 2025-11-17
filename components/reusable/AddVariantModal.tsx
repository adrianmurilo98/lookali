"use client"

import type React from "react"
import { useState } from "react"
import { AddIcon } from "./Icons"
import type { Product, VariantOption, FinalVariant } from "../types"

interface AddVariantModalProps {
  onClose: () => void
  onSave: (variants: FinalVariant[]) => void
  product: Product
}

const AddVariantModal: React.FC<AddVariantModalProps> = ({ onClose, onSave, product }) => {
  const [variantName, setVariantName] = useState("")
  const [options, setOptions] = useState<VariantOption[]>([])

  const handleAddOption = () => {
    setOptions([...options, { name: "", price: 0, stock: 0 }])
  }

  const handleSave = () => {
    const finalVariants: FinalVariant[] = options.map((option, index) => ({
      id: `${product.id}-variant-${index}`,
      productId: product.id,
      name: `${product.name} - ${option.name}`,
      option: option.name,
      price: option.price,
      stock: option.stock,
    }))
    onSave(finalVariants)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-brand-dark dark:text-dark-heading mb-4">Adicionar Variante</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5">
              Nome da Variante
            </label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="Ex: Tamanho, Cor"
              className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm focus:outline-none text-brand-dark dark:text-dark-heading"
            />
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[index].name = e.target.value
                    setOptions(newOptions)
                  }}
                  placeholder="Nome da opção"
                  className="flex-1 bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2 px-3 text-sm"
                />
              </div>
            ))}

            <button
              onClick={handleAddOption}
              className="flex items-center gap-2 text-sm text-brand-dark dark:text-dark-heading hover:underline"
            >
              <AddIcon className="w-4 h-4" />
              Adicionar Opção
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border text-brand-dark dark:text-dark-heading rounded-lg py-2 px-4 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-dark-border"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-dark text-white rounded-lg py-2 px-4 text-sm font-semibold hover:bg-brand-dark/90"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddVariantModal
