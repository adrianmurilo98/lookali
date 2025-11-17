"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteSupplierAction } from "@/app/actions/suppliers"
import { toast } from "sonner"
import ConfirmModal from "../reusable/ConfirmModal"
import { TrashIcon } from "../reusable/Icons"
import Link from "next/link"

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  cnpj: string | null
}

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = (id: string) => {
    setSupplierToDelete(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteSupplierAction(supplierToDelete)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Fornecedor deletado com sucesso!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Erro ao deletar fornecedor")
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setSupplierToDelete(null)
    }
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum fornecedor cadastrado ainda</p>
          <Button asChild>
            <Link href="/erp/suppliers/new">Adicionar primeiro fornecedor</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.cnpj || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/erp/suppliers/${supplier.id}`}>Editar</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "..." : "Deletar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showDeleteModal && (
        <ConfirmModal
          onClose={() => {
            setShowDeleteModal(false)
            setSupplierToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Excluir fornecedor?"
          message="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
          confirmText={isDeleting ? "Excluindo..." : "Excluir"}
          icon={<TrashIcon />}
          isDestructive
          disabled={isDeleting}
        />
      )}
    </>
  )
}
