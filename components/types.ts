export interface Product {
  id: string
  partner_id: string
  name: string
  description: string | null
  price: number
  cost_price: number | null
  profit_margin: number | null
  stock_quantity: number
  min_stock: number | null
  sku: string | null
  gtin: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  unit: string | null
  product_type: string | null
  condition: string | null
  location: string | null
  images: string[] | null
  is_active: boolean
  visibility_status: string | null
  show_price_in_store: boolean | null
  is_on_promotion: boolean | null
  promotion_type: string | null
  promotion_value: number | null
  promotional_price: number | null
  rating: number | null
  created_at: string
  updated_at: string
}

export interface VariantOption {
  name: string
  value: string
}

export interface FinalVariant {
  name: string
  options: VariantOption[]
  price: number
  stock: number
  sku: string
}

export interface Supplier {
  id: string
  partner_id?: string
  name: string
  email: string | null
  phone: string | null
  address?: string | null
  notes?: string | null
  cpf?: string | null
  cnpj?: string | null
  nomeFantasia?: string | null
  personType?: string | null
  contribuinte?: string | null
  inscricaoEstadual?: string | null
  regimeTributario?: string | null
  contribuinteIcms?: string | null
  country?: string | null
  zipCode?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  municipioCodigoIbge?: string | null
  createdAt?: string
  updatedAt?: string
}
