"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Star, Flag, Edit, Trash2 } from 'lucide-react'
import { reportReviewAction, updateReviewAction, deleteReviewAction } from "@/app/actions/reviews"
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  profiles: {
    full_name: string | null
    profile_image_url: string | null
  }
}

interface ProductReviewsListProps {
  reviews: Review[]
  currentUserId?: string
}

export function ProductReviewsList({ reviews, currentUserId }: ProductReviewsListProps) {
  console.log("[v0] ProductReviewsList received reviews:", reviews)
  console.log("[v0] First review profiles data:", reviews[0]?.profiles)
  
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState("")
  const router = useRouter()

  const handleReport = async (reviewId: string) => {
    if (!reportReason.trim()) {
      alert("Por favor, informe o motivo da denúncia")
      return
    }

    setIsSubmitting(true)
    const result = await reportReviewAction(reviewId, reportReason)

    if (result.error) {
      alert(result.error)
    } else {
      alert("Denúncia enviada com sucesso!")
      setReportingReviewId(null)
      setReportReason("")
    }

    setIsSubmitting(false)
  }

  const handleEdit = (review: Review) => {
    setEditingReviewId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment || "")
  }

  const handleUpdateReview = async (reviewId: string) => {
    setIsSubmitting(true)
    const result = await updateReviewAction(reviewId, {
      rating: editRating,
      comment: editComment,
    })

    if (result.error) {
      alert(result.error)
    } else {
      alert("Avaliação atualizada com sucesso!")
      setEditingReviewId(null)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta avaliação?")) {
      return
    }

    setIsSubmitting(true)
    const result = await deleteReviewAction(reviewId)

    if (result.error) {
      alert(result.error)
    } else {
      alert("Avaliação deletada com sucesso!")
      router.refresh()
    }

    setIsSubmitting(false)
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma avaliação ainda. Seja o primeiro a avaliar!
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isOwnReview = currentUserId === review.user_id

        return (
          <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profiles?.profile_image_url || undefined} />
                  <AvatarFallback>
                    {review.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{review.profiles?.full_name || "Usuário"}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(review.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {review.comment && <p className="text-sm mt-2">{review.comment}</p>}
                </div>
              </div>

              <div className="flex gap-1">
                {isOwnReview && (
                  <>
                    <Dialog open={editingReviewId === review.id} onOpenChange={(open) => {
                      if (!open) setEditingReviewId(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar avaliação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Avaliação</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className="transition-colors"
                                >
                                  <Star
                                    className={`w-8 h-8 ${
                                      star <= editRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <Textarea
                            placeholder="Seu comentário..."
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={4}
                          />
                          <Button
                            onClick={() => handleUpdateReview(review.id)}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            {isSubmitting ? "Salvando..." : "Salvar alterações"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {currentUserId && !isOwnReview && (
                  <Dialog open={reportingReviewId === review.id} onOpenChange={(open) => {
                    if (!open) {
                      setReportingReviewId(null)
                      setReportReason("")
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportingReviewId(review.id)}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Denunciar avaliação</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Descreva o motivo da denúncia..."
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          rows={4}
                        />
                        <Button
                          onClick={() => handleReport(review.id)}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? "Enviando..." : "Enviar denúncia"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
