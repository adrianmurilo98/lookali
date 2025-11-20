"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Receipt, Copy, Check, ExternalLink } from "lucide-react"
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
      console.error("[v0] Error loading payment details:", error)
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

  const getExpirationInfo = () => {
    if (!paymentData?.date_of_expiration) return null

    const expirationDate = new Date(paymentData.date_of_expiration)
    const now = new Date()
    const diffInHours = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60))

    return {
      date: expirationDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: expirationDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      hoursRemaining: diffInHours > 0 ? diffInHours : 0,
      isExpired: diffInHours <= 0,
    }
  }

  const expirationInfo = paymentData ? getExpirationInfo() : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full sm:w-auto">
          {isPix ? <QrCode className="w-4 h-4 mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
          Ver forma de pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isPix ? "Pronto! Conclua seu pagamento" : "Pronto! Conclua seu pagamento"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : paymentData ? (
          <div className="space-y-6">
            {/* Amount Display */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-1">Valor do Pix a pagar:</p>
              <p className="text-3xl font-bold">R$ {Number(paymentData.transaction_amount).toFixed(2)}</p>
            </div>

            {/* PIX QR Code and Code */}
            {isPix && paymentData.qr_code_base64 && (
              <div className="space-y-4">
                <p className="text-sm text-center">
                  Falta pouco! Escaneie o código QR pelo seu app de pagamentos ou Internet Banking
                </p>

                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <Image
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    width={240}
                    height={240}
                    className="rounded"
                  />
                </div>

                {paymentData.qr_code && (
                  <div className="space-y-2">
                    <p className="text-sm">Copie este código para pagar pelo Internet Banking</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={paymentData.qr_code}
                        readOnly
                        className="flex-1 px-3 py-2 text-xs border rounded-md bg-muted font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(paymentData.qr_code)}
                        className="shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar código
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {expirationInfo && !expirationInfo.isExpired && (
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <p className="font-medium">Código válido por {expirationInfo.hoursRemaining} horas.</p>
                    <p className="text-muted-foreground text-xs">
                      Você pode pagar até {expirationInfo.date} às {expirationInfo.time}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p>O pagamento será aprovado em 1 ou 2 horas úteis</p>
                  <p>Pagamentos realizados no fim de semana serão identificados na segunda-feira pela manhã.</p>
                  <p>Em caso de feriados, os pagamentos serão identificados no próximo dia útil.</p>
                </div>
              </div>
            )}

            {/* Boleto Information */}
            {isBoleto && (
              <div className="space-y-4">
                {paymentData.barcode && (
                  <div className="space-y-2">
                    <p className="text-sm">Copie este código para pagar pelo Internet Banking</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={paymentData.barcode}
                        readOnly
                        className="flex-1 px-3 py-2 text-xs border rounded-md bg-muted font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(paymentData.barcode)}
                        className="shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar código
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-sm text-center">Você também pode pagar com boleto em uma agência bancária.</p>

                {paymentData.ticket_url && (
                  <Button asChild className="w-full" size="lg">
                    <a href={paymentData.ticket_url} target="_blank" rel="noopener noreferrer">
                      Ver boleto
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p>O pagamento será aprovado em 1 ou 2 horas úteis</p>
                  <p>Pagamentos realizados no fim de semana serão identificados na segunda-feira pela manhã.</p>
                  <p>Em caso de feriados, os pagamentos serão identificados no próximo dia útil.</p>
                  {expirationInfo && !expirationInfo.isExpired && (
                    <p className="font-medium pt-2">Você pode pagar até {expirationInfo.date}</p>
                  )}
                  <p className="pt-2">Também enviamos o boleto para seu e-mail.</p>
                </div>
              </div>
            )}
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
