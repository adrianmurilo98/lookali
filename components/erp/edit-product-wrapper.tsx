"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import AddProductPage from "./add-product-page"
import type { Product } from "../types"
import { updateProductAction, deleteProductAction, checkProductInOrdersAction } from "@/app/actions/products"
import { toast } from "sonner"
import ConfirmModal from "../reusable/ConfirmModal"
import { TrashIcon } from "../reusable/Icons"

interface EditProductWrapperProps {
  product: Product & {
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
  }
  suppliers: Array<{ id: string; name: string; email: string | null; phone: string | null }>
  partnerId: string
}

export function EditProductWrapper({ product, suppliers, partnerId }: EditProductWrapperProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"add" | "details" | "edit">("details")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  const handleBack = () => {
    router.push("/erp/products")
  }

  const handleSaveProduct = async (productData: any) => {
    console.log("[v0] Updating product with data:", productData)
    setIsSaving(true)

    try {
      // Map visibility to Portuguese
      const visibilityMap: Record<string, string> = {
        Published: "Publicado",
        Unpublished: "Oculto",
      }

      const result = await updateProductAction({
        productId: product.id,
        name: productData.name,
        description: productData.description,
        category: productData.category,
        subcategory: productData.subcategory,
        brand: productData.brand,
        sku: productData.sku,
        gtin: productData.gtin,
        unit: productData.unidade,
        product_type: productData.productType,
        condition: productData.condicao,
        cost_price: productData.costPrice,
        price: productData.price,
        stock_quantity: productData.stock,
        min_stock: 10, // You can add this field to the form if needed
        location: productData.localizacao,
        images: productData.images || [],
        visibility_status: visibilityMap[productData.visibility] || "Oculto",
        is_active: productData.status === "Active",
      })

      if (result.success) {
        toast.success("Produto atualizado com sucesso!")
        setMode("details")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao atualizar produto")
      }
    } catch (error) {
      console.error("[v0] Error updating product:", error)
      toast.error("Erro ao atualizar produto")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = async () => {
    // Check if product is in any pending orders
    const result = await checkProductInOrdersAction(product.id)
    if (result.count > 0) {
      setPendingOrdersCount(result.count)
    }
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProductAction(product.id)
      if (result.success) {
        toast.success("Produto desativado com sucesso!")
        router.push("/erp/products")
      } else {
        toast.error(result.error || "Erro ao desativar produto")
      }
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      toast.error("Erro ao desativar produto")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <AddProductPage
        onBack={handleBack}
        product={product}
        mode={mode}
        setMode={setMode}
        onSave={handleSaveProduct}
        onDelete={handleDeleteClick}
        suppliers={suppliers}
        isSaving={isSaving}
      />

      {showDeleteModal && (
        <ConfirmModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Excluir produto?"
          message={
            pendingOrdersCount > 0
              ? `Atenção: Este produto está em ${pendingOrdersCount} ${pendingOrdersCount === 1 ? "pedido pendente" : "pedidos pendentes"}. Tem certeza que deseja excluir?`
              : "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
          }
          confirmText={isDeleting ? "Excluindo..." : "Excluir"}
          icon={<TrashIcon />}
          isDestructive
          disabled={isDeleting}
        />
      )}
    </>
  )
}
