"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createReviewAction } from "@/app/actions/reviews"
import { useRouter } from "next/navigation"

interface ReviewButtonProps {
  orderId: string
  partnerId: string
  productId?: string | null
  serviceId?: string | null
  rentalItemId?: string | null
  spaceId?: string | null
  userId: string
  itemName: string
}

export function ReviewButton({
  orderId,
  partnerId,
  productId,
  serviceId,
  rentalItemId,
  spaceId,
  userId,
  itemName,
}: ReviewButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createReviewAction({
        orderId,
        userId,
        partnerId,
        productId: productId || null,
        serviceId: serviceId || null,
        rentalItemId: rentalItemId || null,
        spaceId: spaceId || null,
        rating,
        comment,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        alert("Avaliação enviada com sucesso!")
        router.refresh()
      }
    } catch (err) {
      setError("Erro ao enviar avaliação")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Avaliar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar pedido</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Nota (1 a 5 estrelas)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl">
                  {star <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sobre sua experiência..."
            />
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
