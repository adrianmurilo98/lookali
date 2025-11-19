"use client"

import type React from "react"
import { useState, type FC, useRef, useEffect } from "react"
import {
  ChevronLeftIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  LinkIcon,
  ListIcon,
  InfoIcon,
  SaveIcon,
  UploadImageIcon,
  AddIcon,
  WandIcon,
  FolderPlusIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "../reusable/Icons"
import AddVariantModal from "../reusable/AddVariantModal"
import type { Product } from "../types"
import AddItemModal from "../reusable/AddItemModal"
import Dropdown, { DropdownItem } from "../reusable/Dropdown"
import ConfirmModal from "../reusable/ConfirmModal"
import CategoryTabs from "../reusable/CategoryTabs"
import { ProductSuppliersSection } from "./product-suppliers-section"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { UnsavedChangesDialog } from "@/components/reusable/UnsavedChangesDialog"

interface AddProductPageProps {
  onBack: () => void
  product?: Product | null
  mode: "add" | "details" | "edit"
  setMode: (mode: "add" | "details" | "edit") => void
  onSave?: (productData: any) => void
  onDelete?: () => void // Added onDelete prop
  suppliers?: Array<{ id: string; name: string; email: string | null; phone: string | null }>
  isSaving?: boolean
}

interface PromotionType {
  id: string
  name: string
  type: "percentage" | "fixed"
  value: number
}

const getEmptyProduct = (): Product & {
  costPrice: number
  description: string
  subcategory: string
  brand: string
  promotionTypeId: string | null
  condicao: string
  gtin: string
  unidade: string
  localizacao: string
  images: string[]
  productType: string
} => ({
  id: "",
  icon: () => null,
  name: "",
  category: "",
  productId: "",
  price: 0,
  costPrice: 0,
  stock: 0,
  dateAdded: "",
  status: "Active",
  visibility: "Published",
  sku: "",
  description: "",
  subcategory: "",
  brand: "",
  promotionTypeId: null,
  condicao: "Novo",
  gtin: "",
  unidade: "",
  localizacao: "",
  images: [],
  productType: "Físico",
})

// --- Helper Components ---

const formatAsCurrency = (value: number): string => {
  if (typeof value !== "number" || isNaN(value)) {
    value = 0
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const CurrencyInput: FC<{
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}> = ({ label, value, onChange, disabled }) => {
  const [displayValue, setDisplayValue] = useState(
    value > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(value) : "",
  )

  useEffect(() => {
    if (!Number.isNaN(value)) {
      const newDisplay = value > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(value) : ""
      if (newDisplay !== displayValue) {
        setDisplayValue(newDisplay)
      }
    }
  }, [value]) // Only depend on value, not displayValue

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    const numericString = inputVal.replace(/\D/g, "")

    if (numericString === "") {
      onChange(0)
      setDisplayValue("")
      return
    }

    const numericValue = Number(numericString) / 100
    onChange(numericValue)
    setDisplayValue(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(numericValue))
  }

  const handleBlur = () => {
    setDisplayValue(value > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(value) : "")
  }

  return (
    <div className="flex-1 w-full">
      <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-sm text-brand-inactive-text dark:text-dark-body pointer-events-none">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0,00"
          className="w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 pl-11 pr-4 text-sm focus:ring-brand-dark focus:border-brand-dark dark:focus:ring-brand-green-dark dark:focus:border-brand-green-dark focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 transition-colors disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
        />
      </div>
    </div>
  )
}

const FormSection: FC<{ title: string; children?: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = "",
}) => (
  <div className={`${className}`}>
    <h2 className="text-lg font-semibold text-brand-dark dark:text-dark-heading mb-4">{title}</h2>
    <div className="space-y-5">{children}</div>
  </div>
)

const FormInput: FC<{
  label: string
  placeholder?: string
  type?: string
  value?: string | number
  prefix?: string
  suffix?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  name: string
  disabled?: boolean
  labelAddon?: React.ReactNode
}> = ({ label, placeholder, type = "text", value, prefix, suffix, onChange, name, disabled, labelAddon }) => (
  <div className="flex-1 w-full">
    <div className="flex items-center gap-2 mb-1.5">
      <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body truncate">{label}</label>
      {labelAddon}
    </div>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-inactive-text dark:text-dark-body">{prefix}</span>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 ${prefix ? "pl-7" : "px-4"} ${suffix ? "pr-10" : "pr-4"} text-sm focus:ring-brand-dark focus:border-brand-dark dark:focus:ring-brand-green-dark dark:focus:border-brand-green-dark focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 transition-colors disabled:bg-gray-50 dark:disabled:bg-dark-border/30`}
      />
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  </div>
)

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2 bg-brand-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 truncate">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-dark"></div>
    </div>
  </div>
)

const RichTextEditor: FC<{ label: string; value: string; onChange: (value: string) => void; disabled?: boolean }> = ({
  label,
  value,
  onChange,
  disabled,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  const handleFormat = (command: string) => {
    document.execCommand(command, false)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const buttons = [
    { name: "bold", icon: BoldIcon, command: "bold" },
    { name: "italic", icon: ItalicIcon, command: "italic" },
    { name: "underline", icon: UnderlineIcon, command: "underline" },
    { name: "link", icon: LinkIcon, command: "createLink" }, // Simplified
    { name: "list", icon: ListIcon, command: "insertUnorderedList" },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
        {label}
      </label>
      <div className="border border-brand-border dark:border-dark-border rounded-lg">
        <div className="flex items-center gap-2 p-2 border-b border-brand-border dark:border-dark-border">
          {buttons.map((btn) => {
            const Icon = btn.icon
            return (
              <button
                type="button"
                key={btn.name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleFormat(btn.command)
                }}
                disabled={disabled}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-border focus:bg-gray-200 dark:focus:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className="w-4 h-4 text-brand-dark dark:text-dark-heading" />
              </button>
            )
          })}
        </div>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="w-full h-32 overflow-y-auto bg-white dark:bg-dark-surface rounded-b-lg py-2 px-4 text-sm focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
        />
      </div>
    </div>
  )
}

const FormDropdown: FC<{
  label: string
  options: { value: string; label: string }[]
  value: string
  setValue: (value: string) => void
  placeholder?: string
  actionItem?: { label: string; icon: React.ReactNode; onClick: () => void }
  disabled?: boolean
  className?: string
}> = ({ label, options, value, setValue, placeholder = "Selecione", actionItem, disabled, className }) => (
  <div className="flex-1 w-full">
    <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">{label}</label>
    <Dropdown
      className={className}
      trigger={
        <button
          disabled={disabled}
          className="flex items-center text-brand-dark dark:text-dark-heading bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-150 w-full text-left justify-between disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
        >
          <span className={`truncate block ${!value ? "text-brand-inactive-text" : ""}`}>
            {options.find((o) => o.value === value)?.label || placeholder}
          </span>
        </button>
      }
      align="left"
      width="w-full"
    >
      {options.map((option) => (
        <DropdownItem key={option.value} onClick={() => setValue(option.value)}>
          {option.label}
        </DropdownItem>
      ))}
      {actionItem && (
        <>
          <div className="border-t border-brand-border dark:border-dark-border my-1 mx-1"></div>
          <DropdownItem onClick={actionItem.onClick}>
            <div className="flex items-center gap-2 text-brand-dark dark:text-dark-heading">
              {actionItem.icon}
              <span>{actionItem.label}</span>
            </div>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  </div>
)

const InfoAlert: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
    <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-blue-800 dark:text-blue-300">{children}</p>
  </div>
)

const Checkbox: FC<{
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}> = ({ id, label, checked, onChange, disabled }) => (
  <label htmlFor={id} className="flex items-center cursor-pointer w-fit">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="custom-checkbox mr-3"
    />
    <span className="text-sm font-medium text-brand-dark dark:text-dark-heading select-none">{label}</span>
  </label>
)

const ProfitMarginDisplay: FC<{ cost: number; sale: number }> = ({ cost, sale }) => {
  const profitValue = sale - cost
  const profitMargin = sale > 0 && cost > 0 ? (profitValue / cost) * 100 : 0

  const displayValue =
    profitValue >= 0 && sale > 0
      ? `${profitMargin.toFixed(2).replace(".", ",")}% (${formatAsCurrency(profitValue)})`
      : "-"

  return (
    <div className="flex-1 w-full">
      <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
        Margem de Lucro
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayValue}
          disabled
          className="w-full bg-gray-50 dark:bg-dark-border/30 border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 transition-colors"
        />
      </div>
    </div>
  )
}

const CalculatedPromoPriceDisplay: FC<{
  label: string
  salePrice: number
  promotion?: PromotionType | null
}> = ({ label, salePrice, promotion }) => {
  const promoPrice = promotion
    ? promotion.type === "percentage"
      ? salePrice * (1 - promotion.value / 100)
      : salePrice - promotion.value
    : salePrice

  return (
    <div className="flex-1 w-full">
      <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-sm text-brand-inactive-text dark:text-dark-body pointer-events-none">
          R$
        </span>
        <input
          type="text"
          value={
            promoPrice > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(promoPrice) : "0,00"
          }
          disabled
          className="w-full bg-gray-50 dark:bg-dark-border/30 border border-brand-border dark:border-dark-border rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 transition-colors"
        />
      </div>
    </div>
  )
}

const AddProductPage: React.FC<AddProductPageProps> = ({
  onBack,
  product: initialProduct,
  mode,
  setMode,
  onSave,
  onDelete, // Destructure onDelete
  suppliers = [],
  isSaving = false,
}) => {
  const isEditing = mode === "edit" || mode === "add"
  const [productData, setProductData] = useState(() => {
    const base = getEmptyProduct()
    if (initialProduct) {
      const images = initialProduct.images || []
      return { ...base, ...initialProduct, images, costPrice: initialProduct.costPrice || initialProduct.price * 0.6 }
    }
    return base
  })
  const [originalProductData, setOriginalProductData] = useState(() => {
    const base = getEmptyProduct()
    if (initialProduct) {
      const images =
        initialProduct.id === "2" ? ["https://i.imgur.com/Q2Q5I1P.png", "https://i.imgur.com/rNIm8pr.png"] : []
      return { ...base, ...initialProduct, images, costPrice: initialProduct.price * 0.6 }
    }
    return base
  })
  const [activeTab, setActiveTab] = useState("Dados Gerais")

  const isDirty = JSON.stringify(productData) !== JSON.stringify(originalProductData)

  const {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  } = useUnsavedChanges(isEditing && isDirty)

  const [useShortPlaceholder, setUseShortPlaceholder] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setUseShortPlaceholder(window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  const handleBack = () => {
    if (isEditing && isDirty) {
      handleNavigation(onBack)
    } else {
      onBack()
    }
  }

  const handleCancelEdit = () => {
    if (isEditing && isDirty) {
      handleNavigation(() => {
        if (initialProduct) {
          setProductData({
            ...getEmptyProduct(),
            ...initialProduct,
            images: originalProductData.images,
            costPrice: originalProductData.costPrice,
          })
          setOriginalProductData({
            ...getEmptyProduct(),
            ...initialProduct,
            images: originalProductData.images,
            costPrice: originalProductData.costPrice,
          })
          setMode("details")
        } else {
          onBack()
        }
      })
    } else {
      if (initialProduct) {
        setProductData({
          ...getEmptyProduct(),
          ...initialProduct,
          images: originalProductData.images,
          costPrice: originalProductData.costPrice,
        })
        setOriginalProductData({
          ...getEmptyProduct(),
          ...initialProduct,
          images: originalProductData.images,
          costPrice: originalProductData.costPrice,
        })
        setMode("details")
      } else {
        onBack()
      }
    }
  }

  const handleSave = () => {
    console.log("[v0] Saving product data:", productData)
    if (onSave) {
      onSave(productData)
    }
  }


  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)

  const [categories, setCategories] = useState([
    "Roupas Masculinas",
    "Roupas Femininas",
    "Roupas Infantis",
    "Electronics",
    "Apparel",
    "Groceries",
  ])
  const [subCategories, setSubCategories] = useState([
    "Tops e Camisetas Masculinas",
    "Calças Masculinas",
    "Acessórios Masculinos",
  ])
  const [brands, setBrands] = useState(["Adidas", "Nike", "Puma"])
  const [promotionTypes, setPromotionTypes] = useState<PromotionType[]>([
    { id: "1", name: "Oferta de Verão", type: "percentage", value: 15 },
    { id: "2", name: "Liquidação de Inverno", type: "fixed", value: 25 },
    { id: "3", name: "Queima de Estoque", type: "percentage", value: 50 },
  ])
  const [locations, setLocations] = useState(["Depósito Principal", "Loja Física"])

  const [showPriceInStore, setShowPriceInStore] = useState(true)
  const [isPromotion, setIsPromotion] = useState(false)

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [addItemModalConfig, setAddItemModalConfig] = useState<any | null>(null)
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(categories[0] || "")

  const [productSuppliers, setProductSuppliers] = useState<
    Array<{
      supplierId: string
      supplierName?: string
      costPrice?: number
      supplierSku?: string
      leadTimeDays?: number
    }>
  >([])

  const promotionDropdownOptions = promotionTypes.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.type === "fixed" ? formatAsCurrency(p.value) : `${p.value}%`} desc.)`,
  }))

  const selectedPromotion = promotionTypes.find((p) => p.id === productData.promotionTypeId)

  const openAddItemModal = (type: "category" | "subcategory" | "brand" | "promotion" | "location") => {
    let config = null
    if (type === "category") {
      config = {
        title: "Adicionar Nova Categoria",
        label: "Nome da Categoria",
        placeholder: "Ex: Eletrônicos",
        onSave: (newItem: string) => {
          setCategories((prev) => [...prev, newItem])
          handleInputChange({ target: { name: "category", value: newItem } } as any)
        },
      }
    } else if (type === "subcategory") {
      config = {
        title: "Adicionar Nova Subcategoria",
        label: "Nome da Subcategoria",
        placeholder: "Ex: Smartphones",
        onSave: (newItem: string, category: string) => {
          console.log(`New subcategory '${newItem}' added to category '${category}'`)
          setSubCategories((prev) => [...prev, newItem])
          handleInputChange({ target: { name: "subcategory", value: newItem } } as any)
        },
        dropdownLabel: "Categoria",
        dropdownOptions: categories,
        dropdownValue: selectedCategoryForSub,
        onDropdownChange: setSelectedCategoryForSub,
      }
    } else if (type === "brand") {
      config = {
        title: "Adicionar Nova Marca",
        label: "Nome da Marca",
        placeholder: "Ex: Apple",
        onSave: (newItem: string) => {
          setBrands((prev) => [...prev, newItem])
          handleInputChange({ target: { name: "brand", value: newItem } } as any)
        },
      }
    } else if (type === "promotion") {
      config = {
        type: "promotion",
        title: "Adicionar Novo Tipo de Promoção",
        onSave: (newPromo: Omit<PromotionType, "id">) => {
          const newPromoWithId = { ...newPromo, id: Date.now().toString() }
          setPromotionTypes((prev) => [...prev, newPromoWithId])
          handleInputChange({ target: { name: "promotionTypeId", value: newPromoWithId.id } } as any)
        },
      }
    } else if (type === "location") {
      config = {
        title: "Adicionar Nova Localização",
        label: "Nome da Localização",
        placeholder: "Ex: Depósito B",
        onSave: (newItem: string) => {
          setLocations((prev) => [...prev, newItem])
          handleInputChange({ target: { name: "localizacao", value: newItem } } as any)
        },
      }
    }
    setAddItemModalConfig(config)
    setIsAddItemModalOpen(true)
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let randomCode = ''
    for (let i = 0; i < 6; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleInputChange({ target: { name: "sku", value: randomCode } } as any)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } },
  ) => {
    const { name, value } = e.target
    setProductData((prev) => ({ ...prev, [name]: value }))
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      files.forEach((file) => {
        if (file instanceof Blob) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setProductData((prev) => ({
              ...prev,
              images: [...(prev.images || []), reader.result as string],
            }))
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removeImage = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }))
  }

  const statusText: { [key in Product["status"]]: string } = { Active: "Ativo", Inactive: "Inativo" }
  const visibilityText: { [key in Product["visibility"]]: string } = { Published: "Publicado",Unpublished: "Oculto" }

  const pageTitle = mode === "add" ? "Adicionar Novo Produto" : mode === "edit" ? "Editando Produto" : productData.name
  const pageSubTitle =
    mode === "add"
      ? "Adicione um novo produto à sua loja"
      : mode === "edit"
        ? productData.name
        : `ID: ${productData.productId} | Criado em: ${productData.dateAdded}`

  return (
    <>
      <div className="page-fade-in">
        <div className="px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-brand-dark dark:text-dark-heading" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-dark dark:text-dark-heading">{pageTitle}</h1>
              </div>
              <p className="text-sm text-brand-inactive-text dark:text-dark-body">{pageSubTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border text-brand-dark dark:text-dark-heading rounded-lg py-2 px-4 text-sm font-semibold flex items-center hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-brand-dark text-white rounded-lg py-2 px-4 text-sm font-semibold flex items-center hover:bg-brand-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Produto"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onDelete}
                  className="bg-white dark:bg-dark-surface border border-red-500/50 text-brand-red rounded-lg py-2 px-4 text-sm font-semibold flex items-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4 mr-2" /> Excluir
                </button>
                <button
                  onClick={() => setMode("edit")}
                  className="bg-brand-dark text-white rounded-lg py-2 px-4 text-sm font-semibold flex items-center hover:bg-brand-dark/90 transition-colors"
                >
                  Editar Produto
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6">
          <CategoryTabs
            categories={["Dados Gerais", "Estoque", "Variantes"]}
            selectedCategory={activeTab}
            onSelectCategory={setActiveTab}
            disabled={!isEditing}
          />
        </div>

        <div key={activeTab} className="py-6 px-4 sm:px-6 tab-content-fade-in">
          <fieldset disabled={!isEditing} className="disabled:opacity-70">
            {activeTab === "Variantes" ? (
              <div className="space-y-6">
                <FormSection
                  title="Variantes"
                  className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                >
                  <div className="text-center py-12 border-2 border-dashed border-brand-border dark:border-dark-border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-border rounded-full flex items-center justify-center mx-auto text-3xl text-brand-inactive-text dark:text-dark-body">
                      <FolderPlusIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-dark-heading mt-4">
                      Não há variantes
                    </h3>
                    <p className="text-sm text-brand-inactive-text dark:text-dark-body mt-1">
                      Você pode adicionar mais variantes para seu produto
                      <br /> clicando no botão abaixo
                    </p>
                    <button
                      disabled={!isEditing}
                      onClick={() => setIsVariantModalOpen(true)}
                      className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-border text-brand-dark dark:text-dark-heading flex items-center mx-auto hover:underline transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <AddIcon className="w-4 h-4 mr-2" />
                      Adicionar variante
                    </button>
                  </div>
                </FormSection>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12 lg:items-start">
                {/* LEFT COLUMN */}
                <div className="space-y-6 relative">
                  {activeTab === "Dados Gerais" && (
                    <>
                      <FormSection
                        title="Informações Básicas"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <FormInput
                          label="Nome do Produto"
                          name="name"
                          value={productData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <RichTextEditor
                          label="Descrição do Produto"
                          value={productData.description}
                          onChange={(value) => handleInputChange({ target: { name: "description", value } })}
                          disabled={!isEditing}
                        />
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Tipo de Produto"
                            options={[
                              { value: "Físico", label: "Físico" },
                              { value: "Digital", label: "Digital" },
                            ]}
                            value={productData.productType}
                            setValue={(v) => handleInputChange({ target: { name: "productType", value: v } })}
                          />
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Condição"
                            options={[
                              { value: "Novo", label: "Novo" },
                              { value: "Usado", label: "Usado" },
                            ]}
                            value={productData.condicao}
                            setValue={(v) => handleInputChange({ target: { name: "condicao", value: v } })}
                          />
                          <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
                              Visibilidade Online
                            </label>
                            <Dropdown
                              className="w-full"
                              trigger={
                                <button
                                  disabled={!isEditing}
                                  className="flex items-center text-brand-dark dark:text-dark-heading bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg py-2.5 px-4 text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-150 w-full text-left justify-between disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
                                >
                                  <div
                                    className={`flex items-center ${!productData.visibility ? "text-brand-inactive-text" : ""}`}
                                  >
                                    {productData.visibility && (
                                      <span
                                        className={`w-2 h-2 rounded-full mr-2 ${productData.visibility === "Published" ? "bg-brand-green-dark" : "bg-gray-400"}`}
                                      ></span>
                                    )}
                                    <span className="truncate">
                                      {productData.visibility ? visibilityText[productData.visibility] : "Selecione"}
                                    </span>
                                  </div>
                                </button>
                              }
                              align="left"
                              width="w-full"
                            >
                              <DropdownItem
                                onClick={() =>
                                  handleInputChange({ target: { name: "visibility", value: "Published" } })
                                }
                              >
                                <div className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-brand-green-dark mr-2"></span> Publicado
                                </div>
                              </DropdownItem>
                              <DropdownItem
                                onClick={() =>
                                  handleInputChange({ target: { name: "visibility", value: "Unpublished" } })
                                }
                              >
                                <div className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span> Oculto
                                </div>
                              </DropdownItem>
                            </Dropdown>
                          </div>
                        </div>
                      </FormSection>
                      <FormSection
                        title="Detalhes do Produto"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-brand-dark/80 dark:text-dark-body mb-1.5 truncate">
                              Código do produto
                            </label>
                            <div className="flex">
                              <input
                                disabled={!isEditing}
                                type="text"
                                value={productData.sku}
                                onChange={(e) => handleInputChange({ target: { name: "sku", value: e.target.value } })}
                                className="w-full bg-white dark:bg-dark-surface border border-r-0 border-brand-border dark:border-dark-border rounded-l-lg py-2.5 px-4 text-sm focus:ring-brand-dark focus:border-brand-dark dark:focus:ring-brand-green-dark dark:focus:border-brand-green-dark focus:outline-none text-brand-dark dark:text-dark-heading placeholder:text-brand-dark/70 dark:placeholder:text-dark-heading/70 transition-colors disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
                              />
                              <button
                                type="button"
                                onClick={generateRandomCode}
                                disabled={!isEditing}
                                title="Gerar código aleatório"
                                className="flex items-center justify-center h-auto px-3 text-brand-dark dark:text-dark-heading text-sm bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-r-lg hover:bg-gray-100 dark:hover:bg-dark-border disabled:bg-gray-50 dark:disabled:bg-dark-border/30"
                              >
                                <WandIcon className="w-4 h-4 text-brand-inactive-text" />
                              </button>
                            </div>
                          </div>
                          <FormInput
                            label="GTIN/EAN"
                            name="gtin"
                            value={productData.gtin}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            labelAddon={
                              <Tooltip text="O código de 13 dígitos do produto. Essencial para uso de leitor de código de barras no PDV.">
                                <InfoIcon className="w-4 h-4 text-brand-inactive-text" />
                              </Tooltip>
                            }
                          />
                          <FormInput
                            label="Unidade"
                            name="unidade"
                            value={productData.unidade}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Categoria"
                            options={categories.map((c) => ({ value: c, label: c }))}
                            value={productData.category}
                            setValue={(value) => handleInputChange({ target: { name: "category", value } })}
                            placeholder={useShortPlaceholder ? "Selecione" : "Selecione uma categoria"}
                            actionItem={{
                              label: "Adicionar categoria",
                              icon: <AddIcon className="w-4 h-4" />,
                              onClick: () => openAddItemModal("category"),
                            }}
                          />
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Subcategoria"
                            options={subCategories.map((c) => ({ value: c, label: c }))}
                            value={productData.subcategory}
                            setValue={(value) => handleInputChange({ target: { name: "subcategory", value } })}
                            placeholder={useShortPlaceholder ? "Selecione" : "Selecione uma subcategoria"}
                            actionItem={{
                              label: "Adicionar subcategoria",
                              icon: <AddIcon className="w-4 h-4" />,
                              onClick: () => openAddItemModal("subcategory"),
                            }}
                          />
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Marca"
                            options={brands.map((c) => ({ value: c, label: c }))}
                            value={productData.brand}
                            setValue={(value) => handleInputChange({ target: { name: "brand", value } })}
                            placeholder={useShortPlaceholder ? "Selecione" : "Selecione uma marca"}
                            actionItem={{
                              label: "Adicionar marca",
                              icon: <AddIcon className="w-4 h-4" />,
                              onClick: () => openAddItemModal("brand"),
                            }}
                          />
                        </div>
                      </FormSection>
                    </>
                  )}
                  {activeTab === "Estoque" && (
                    <>
                      <FormSection
                        title="Estoque"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <FormInput
                            label="Estoque do Produto"
                            name="stock"
                            type="number"
                            value={productData.stock.toString()}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                          <FormInput
                            label="Estoque Mínimo"
                            name="minStock"
                            type="number"
                            value={"10"}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                          <FormDropdown
                            className="w-full"
                            disabled={!isEditing}
                            label="Localização"
                            options={locations.map((l) => ({ value: l, label: l }))}
                            value={productData.localizacao}
                            setValue={(v) => handleInputChange({ target: { name: "localizacao", value: v } })}
                            actionItem={{
                              label: "Adicionar localização",
                              icon: <AddIcon className="w-4 h-4" />,
                              onClick: () => openAddItemModal("location"),
                            }}
                          />
                        </div>
                      </FormSection>
                    </>
                  )}
                  <div className="hidden lg:block absolute top-0 bottom-0 right-0 translate-x-[1.5rem] w-px bg-brand-border dark:border-dark-border"></div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  {activeTab === "Dados Gerais" && (
                    <>
                      <FormSection
                        title="Preço"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <div className="space-y-5">
                          {showPriceInStore && (
                            <div className="animate-slide-up-fade">
                              <div className="flex flex-col md:flex-row items-start gap-4">
                                <CurrencyInput
                                  label="Preço de Custo"
                                  value={productData.costPrice}
                                  onChange={(newValue) =>
                                    handleInputChange({ target: { name: "costPrice", value: newValue } })
                                  }
                                  disabled={!isEditing}
                                />
                                <CurrencyInput
                                  label="Preço de Venda"
                                  value={productData.price}
                                  onChange={(newValue) =>
                                    handleInputChange({ target: { name: "price", value: newValue } })
                                  }
                                  disabled={!isEditing}
                                />
                                <ProfitMarginDisplay cost={productData.costPrice} sale={productData.price} />
                              </div>

                              <div className={`promo-container ${isPromotion ? "open" : ""}`}>
                                <div className="promo-container-inner">
                                  <div className="promo-content">
                                    <div className="flex flex-col md:flex-row items-end gap-4">
                                      <FormDropdown
                                        className="w-full"
                                        label="Tipo de Promoção"
                                        options={promotionDropdownOptions}
                                        value={productData.promotionTypeId || ""}
                                        setValue={(value) =>
                                          handleInputChange({ target: { name: "promotionTypeId", value } })
                                        }
                                        placeholder="Selecione a promoção"
                                        actionItem={{
                                          label: "Adicionar promoção",
                                          icon: <AddIcon className="w-4 h-4" />,
                                          onClick: () => openAddItemModal("promotion"),
                                        }}
                                        disabled={!isEditing}
                                      />
                                      <CalculatedPromoPriceDisplay
                                        label="Preço Promocional"
                                        salePrice={productData.price}
                                        promotion={selectedPromotion}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4 pt-2">
                            <Checkbox
                              id="show-price-checkbox"
                              label="Exibir o preço na loja"
                              checked={showPriceInStore}
                              onChange={(checked) => {
                                setShowPriceInStore(checked)
                                if (!checked) {
                                  setIsPromotion(false)
                                }
                              }}
                              disabled={!isEditing}
                            />
                            {showPriceInStore && (
                              <div className="animate-slide-up-fade">
                                <Checkbox
                                  id="is-promotion-checkbox"
                                  label="Produto em promoção"
                                  checked={isPromotion}
                                  onChange={setIsPromotion}
                                  disabled={!isEditing}
                                />
                              </div>
                            )}
                          </div>

                          {!showPriceInStore && (
                            <div className="pt-2 animate-slide-up-fade">
                              <InfoAlert>
                                Ao não mostrar o preço, o produto será salvo com um valor de 0 (zero) e, em sua loja, o
                                botão de compra dirá "Preço sob consulta".
                              </InfoAlert>
                            </div>
                          )}
                        </div>
                      </FormSection>
                      <FormSection
                        title="Imagem do Produto"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          hidden
                          multiple
                          accept="image/*"
                          disabled={!isEditing}
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div
                            onClick={() => isEditing && fileInputRef.current?.click()}
                            className={`aspect-square border-2 border-dashed border-brand-green-dark dark:border-brand-green bg-brand-green-light/50 dark:bg-dark-border/50 rounded-lg flex flex-col items-center justify-center text-center p-2 ${isEditing ? "cursor-pointer hover:border-brand-dark dark:hover:border-brand-green" : "cursor-not-allowed"}`}
                          >
                            <UploadImageIcon className="w-6 h-6 text-brand-dark dark:text-dark-heading" />
                            <p className="text-xs text-brand-dark dark:text-dark-heading leading-tight mt-1">
                              Clique para Enviar
                            </p>
                          </div>
                          {(productData.images || []).map((image, index) => (
                            <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border border-brand-border dark:border-dark-border">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="text-xs bg-white text-red-600 px-2 py-1 rounded-md"
                                  >
                                    Remover
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </FormSection>
                    </>
                  )}
                  {activeTab === "Estoque" && (
                    <>
                      <FormSection
                        title="Fornecedores"
                        className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-brand-border dark:border-dark-border"
                      >
                        <ProductSuppliersSection
                          suppliers={suppliers}
                          selectedSuppliers={productSuppliers}
                          onChange={setProductSuppliers}
                          disabled={!isEditing}
                        />
                      </FormSection>
                    </>
                  )}
                </div>
              </div>
            )}
          </fieldset>
        </div>
      </div>
      {isVariantModalOpen && (
        <AddVariantModal
          onClose={() => setIsVariantModalOpen(false)}
          onSave={(variants) => {
            console.log("Saved variants:", variants)
            setIsVariantModalOpen(false)
          }}
          product={productData as Product}
        />
      )}
      {isAddItemModalOpen && addItemModalConfig && (
        <AddItemModal {...addItemModalConfig} onClose={() => setIsAddItemModalOpen(false)} />
      )}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </>
  )
}

export default AddProductPage
