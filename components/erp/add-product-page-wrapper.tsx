"use client"

import { useRouter } from 'next/navigation'
import { useState } from "react"
import AddProductPage from "./add-product-page"
import { createProductComprehensiveAction } from "@/app/actions/products"
import { uploadImageToCloudinaryAction } from "@/app/actions/cloudinary"
import { toast } from "@/hooks/use-toast"

interface AddProductPageWrapperProps {
  partnerId: string
  suppliers: Array<{ id: string; name: string; email: string | null; phone: string | null }>
}

export default function AddProductPageWrapper({ partnerId, suppliers }: AddProductPageWrapperProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"add" | "details" | "edit">("add")
  const [isSaving, setIsSaving] = useState(false)

  const handleBack = () => {
    router.push("/erp/products")
  }

  const handleSave = async (productData: any) => {
    setIsSaving(true)
    try {
      let cloudinaryUrls: string[] = []
      if (productData.images && productData.images.length > 0) {
        console.log("[v0] Uploading images to Cloudinary...")
        
        for (const image of productData.images) {
          // Check if it's a base64 image
          if (image.startsWith("data:image")) {
            const uploadResult = await uploadImageToCloudinaryAction(image, "products")
            if (uploadResult.success && uploadResult.url) {
              cloudinaryUrls.push(uploadResult.url)
            } else {
              console.error("[v0] Failed to upload image:", uploadResult.error)
            }
          } else {
            // If it's already a URL, keep it
            cloudinaryUrls.push(image)
          }
        }
      }

      const transformedData = {
        partnerId: partnerId,
        name: productData.name || '',
        description: productData.description || null,
        price: Number(productData.price) || 0,
        costPrice: Number(productData.costPrice) || null,
        stockQuantity: Number(productData.stock) || 0,
        minStock: Number(productData.minStock) || 0,
        sku: productData.sku || null,
        gtin: productData.gtin || null,
        category: productData.category || null,
        subcategory: productData.subcategory || null,
        brand: productData.brand || null,
        unit: productData.unidade || null,
        productType: productData.productType || 'Físico',
        condition: productData.condicao || 'Novo',
        location: productData.localizacao || null,
        visibilityStatus: productData.visibility === 'Published' ? 'Publicado' : 'Oculto',
        showPriceInStore: true,
        isOnPromotion: Boolean(productData.promotionTypeId),
        promotionType: productData.promotionTypeId || null,
        promotionValue: null,
        images: cloudinaryUrls.length > 0 ? cloudinaryUrls : null,
      }

      const result = await createProductComprehensiveAction(transformedData)
      
      if (result.success) {
        toast({
          title: "Produto criado!",
          description: "O produto foi adicionado com sucesso.",
        })
        router.push("/erp/products")
      } else {
        toast({
          title: "Erro ao criar produto",
          description: result.error || "Ocorreu um erro ao criar o produto.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AddProductPage
      onBack={handleBack}
      mode={mode}
      setMode={setMode}
      onSave={handleSave}
      suppliers={suppliers}
      isSaving={isSaving}
    />
  )
}
