"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Receipt, Copy, Check } from "lucide-react"
import Image from "next/image"

interface PaymentDetailsDialogProps {
  paymentId: string
  paymentMethod: string
}

export function PaymentDetailsDialog({ paymentId, paymentMethod }: PaymentDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const loadPaymentDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mercadopago/payment-details/${paymentId}`)
      const data = await response.json()

      if (data.success) {
        setPaymentData(data.payment)
      }
    } catch (error) {
      console.error("Error loading payment details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !paymentData) {
      loadPaymentDetails()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isPix = paymentMethod?.toLowerCase().includes("pix")
  const isBoleto = paymentMethod?.toLowerCase().includes("boleto") || paymentMethod?.toLowerCase().includes("ticket")

  if (!isPix && !isBoleto) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isPix ? <QrCode className="w-4 h-4 mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
          Ver {isPix ? "QR Code" : "Boleto"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isPix ? "Pagar com PIX" : "Boleto Bancário"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : paymentData ? (
          <div className="space-y-4">
            {isPix && paymentData.qr_code_base64 && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    width={256}
                    height={256}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Escaneie o código QR pelo seu app de pagamentos ou Internet Banking
                </p>
              </div>
            )}

            {isPix && paymentData.qr_code && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Se preferir, você pode pagar copiando e colando o código abaixo:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentData.qr_code}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(paymentData.qr_code)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {isBoleto && paymentData.ticket_url && (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Clique no botão abaixo para visualizar e pagar o boleto
                </p>
                <Button asChild className="w-full">
                  <a href={paymentData.ticket_url} target="_blank" rel="noopener noreferrer">
                    Abrir Boleto
                  </a>
                </Button>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-semibold">R$ {Number(paymentData.transaction_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={`font-semibold ${
                    paymentData.status === "approved"
                      ? "text-green-600"
                      : paymentData.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {paymentData.status === "approved"
                    ? "Aprovado"
                    : paymentData.status === "pending"
                      ? "Pendente"
                      : "Rejeitado"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Não foi possível carregar os detalhes do pagamento
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
