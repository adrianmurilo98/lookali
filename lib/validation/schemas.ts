import { z } from "zod"

// Produto
export const ProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  description: z.string().max(5000, "Descrição muito longa").optional().nullable(),
  price: z.number().min(0.01, "Preço deve ser maior que zero").max(999999, "Preço muito alto"),
  stockQuantity: z.number().int("Estoque deve ser número inteiro").min(0, "Estoque não pode ser negativo").max(999999),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean(),
  partnerId: z.string().uuid("ID de parceiro inválido"),
})

// Pedido
export const OrderSchema = z.object({
  itemId: z.string().uuid("ID de item inválido"),
  itemType: z.enum(["product", "service", "rental_item", "space"]),
  quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1").max(1000),
  totalAmount: z.number().min(0.01, "Valor total inválido").max(999999),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryAddress: z.string().min(10, "Endereço muito curto").max(500),
  paymentMethod: z.string().min(1, "Método de pagamento obrigatório").max(100),
  notes: z.string().max(1000).optional(),
  partnerId: z.string().uuid(),
  buyerId: z.string().uuid(),
})

// Parceiro
export const PartnerSchema = z.object({
  userId: z.string().uuid(),
  storeName: z.string().min(3, "Nome da loja muito curto").max(200, "Nome da loja muito longo"),
  storeDescription: z.string().min(10, "Descrição muito curta").max(5000),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(3).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  businessType: z.enum(["pf", "pj"]),
  cnpj: z
    .string()
    .regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos")
    .optional()
    .nullable(),
  openingHours: z.any(),
  storeImageUrl: z.string().url("URL inválida").optional().nullable(),
  sellsProducts: z.boolean(),
  providesServices: z.boolean(),
  rentsItems: z.boolean(),
  hasReservableSpaces: z.boolean(),
})

// Review
export const ReviewSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  partnerId: z.string().uuid(),
  productId: z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  rentalItemId: z.string().uuid().optional().nullable(),
  spaceId: z.string().uuid().optional().nullable(),
  rating: z.number().int().min(1, "Avaliação mínima é 1").max(5, "Avaliação máxima é 5"),
  comment: z.string().max(2000, "Comentário muito longo").optional(),
})

// Cliente
export const CustomerSchema = z.object({
  partnerId: z.string().uuid(),
  name: z.string().min(3, "Nome muito curto").max(200),
  email: z.string().email("Email inválido").max(200).optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, "Telefone inválido")
    .max(20)
    .optional()
    .nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

// Método de Pagamento
export const PaymentMethodSchema = z.object({
  partnerId: z.string().uuid(),
  name: z.string().min(1).max(100),
  paymentType: z.enum(["dinheiro", "pix", "credito", "debito", "vale_alimentacao", "vale_refeicao", "outros"]),
  cardBrand: z.string().max(50).optional().nullable(),
  isActive: z.boolean(),
  feeType: z.enum(["percentage", "fixed", "both"]).optional().nullable(),
  percentageRate: z.number().min(0).max(100).optional().nullable(),
  fixedAmount: z.number().min(0).optional().nullable(),
  receivingDays: z.number().int().min(0).max(365).optional().nullable(),
  maxInstallments: z.number().int().min(1).max(24).optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
})

// Perfil de Usuário
export const UserProfileSchema = z.object({
  fullName: z.string().min(3, "Nome muito curto").max(200),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, "Telefone inválido")
    .max(20)
    .optional()
    .nullable(),
  zipCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional()
    .nullable(),
  street: z.string().max(200).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().length(2).optional().nullable(),
})
