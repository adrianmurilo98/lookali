import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { EditProductWrapper } from "@/components/erp/edit-product-wrapper"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    redirect("/erp/products/new")
  }

  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  const [{ data: partner }, { data: product }, { data: suppliers }] = await Promise.all([
    supabase.from("partners").select("*").eq("user_id", userData.user.id).single(),
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("suppliers").select("id, name, email, phone").order("name"),
  ])

  if (!partner) {
    redirect("/dashboard")
  }

  if (!product || product.partner_id !== partner.id) {
    redirect("/erp/products")
  }

  const formattedProduct = {
    id: product.id,
    name: product.name,
    category: product.category || "",
    productId: product.sku || "",
    price: Number(product.price),
    costPrice: Number(product.cost_price || 0),
    stock: product.stock_quantity,
    dateAdded: new Date(product.created_at).toLocaleDateString("pt-BR"),
    status: product.is_active ? ("Active" as const) : ("Inactive" as const),
    visibility: product.visibility_status === "Publicado" ? ("Published" as const) : ("Unpublished" as const),
    sku: product.sku || "",
    description: product.description || "",
    subcategory: product.subcategory || "",
    brand: product.brand || "",
    promotionTypeId: null,
    condicao: product.condition || "Novo",
    gtin: product.gtin || "",
    unidade: product.unit || "",
    localizacao: product.location || "",
    images: Array.isArray(product.images) ? product.images : [],
    productType: product.product_type || "Físico",
  }

  return <EditProductWrapper product={formattedProduct} suppliers={suppliers || []} partnerId={partner.id} />
}
