"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from 'lucide-react'
import { createReviewAction } from "@/app/actions/reviews"
import { useRouter } from 'next/navigation'

interface ProductReviewFormProps {
  productId: string
  partnerId: string
  userId: string
  orderId: string
}

export function ProductReviewForm({ productId, partnerId, userId, orderId }: ProductReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const result = await createReviewAction({
      orderId,
      userId,
      partnerId,
      productId,
      serviceId: null,
      rentalItemId: null,
      spaceId: null,
      rating,
      comment,
    })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    alert("Avaliação enviada com sucesso!")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Sua avaliação</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="text-sm font-medium mb-2 block">
          Comentário (opcional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Compartilhe sua experiência com este produto..."
          rows={4}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  )
}
