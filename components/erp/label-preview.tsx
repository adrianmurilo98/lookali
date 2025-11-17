"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import JsBarcode from "jsbarcode"
import { Printer, Download } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string | null
  gtin: string | null
  price: number
  description: string | null
  labelQuantity: number
}

interface LabelPreviewProps {
  products: Product[]
  layout: string
  onClose: () => void
}

const layoutConfigs: Record<string, { cols: number; rows: number; width: string; height: string }> = {
  "18": { cols: 3, rows: 6, width: "60mm", height: "40mm" },
  "21": { cols: 3, rows: 7, width: "60mm", height: "35mm" },
  "25": { cols: 5, rows: 5, width: "40mm", height: "40mm" },
  "65": { cols: 5, rows: 13, width: "40mm", height: "24mm" },
}

export function LabelPreview({ products, layout, onClose }: LabelPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [labelsGenerated, setLabelsGenerated] = useState(false)

  const config = layoutConfigs[layout]
  const labelsPerPage = config.cols * config.rows

  // Gerar array de todas as etiquetas
  const allLabels = products.flatMap((product) =>
    Array(product.labelQuantity)
      .fill(null)
      .map((_, index) => ({
        ...product,
        barcodeValue: product.gtin || product.sku || `PROD-${product.id.substring(0, 8)}`,
        key: `${product.id}-${index}`,
      })),
  )

  // Gerar código de barras para cada etiqueta
  useEffect(() => {
    setTimeout(() => {
      allLabels.forEach((label) => {
        const elementId = `barcode-${label.key}`
        const element = document.getElementById(elementId)
        if (element && !element.querySelector("svg")) {
          try {
            JsBarcode(`#${elementId}`, label.barcodeValue, {
              format: "CODE128",
              width: 1.5,
              height: 40,
              fontSize: 12,
              margin: 2,
            })
          } catch (error) {
            console.error("Erro ao gerar código de barras:", error)
          }
        }
      })
      setLabelsGenerated(true)
    }, 100)
  }, [allLabels])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Usar library como html2pdf para download
    alert("Recurso de download PDF em desenvolvimento. Use Ctrl+P para imprimir e salvar como PDF.")
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Etiquetas ({allLabels.length} etiquetas)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Salvar como PDF
            </Button>
          </div>

          <div
            ref={printRef}
            className="bg-white"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              gap: "0",
              width: "210mm",
              height: "297mm",
              padding: "10mm",
              margin: "0 auto",
            }}
          >
            {Array(Math.ceil(allLabels.length / labelsPerPage) * labelsPerPage)
              .fill(null)
              .map((_, index) => {
                const label = allLabels[index]
                return (
                  <div
                    key={index}
                    style={{
                      width: config.width,
                      height: config.height,
                      border: "1px solid #e0e0e0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "3mm",
                      fontSize: "10px",
                      overflow: "hidden",
                    }}
                  >
                    {label ? (
                      <>
                        <div style={{ textAlign: "center", width: "100%", fontSize: "8px", fontWeight: "bold" }}>
                          <p
                            style={{ margin: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {label.name.substring(0, 15)}
                          </p>
                          {label.description && (
                            <p
                              style={{
                                margin: "0",
                                fontSize: "7px",
                                color: "#666",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {label.description.substring(0, 12)}
                            </p>
                          )}
                        </div>
                        <div
                          id={`barcode-${label.key}`}
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            margin: "1mm 0",
                          }}
                        />
                        <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "bold", color: "#333" }}>
                          R$ {Number(label.price).toFixed(2)}
                        </div>
                      </>
                    ) : null}
                  </div>
                )
              })}
          </div>
        </div>

        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            div {
              box-shadow: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
