"use client"

import type React from "react"

interface ConfirmModalProps {
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  icon?: React.ReactNode
  isDestructive?: boolean // Added isDestructive prop for styling
  disabled?: boolean // Added disabled prop
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  icon,
  isDestructive = false,
  disabled = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
        {icon && (
          <div className={`flex justify-center mb-4 ${isDestructive ? "text-red-500" : "text-yellow-500"}`}>{icon}</div>
        )}

        <h2 className="text-xl font-bold text-brand-dark dark:text-dark-heading mb-2 text-center">{title}</h2>
        <p className="text-sm text-brand-inactive-text dark:text-dark-body mb-6 text-center">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={disabled}
            className="flex-1 bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border text-brand-dark dark:text-dark-heading rounded-lg py-2 px-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`flex-1 text-white rounded-lg py-2 px-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-brand-dark hover:bg-brand-dark/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
