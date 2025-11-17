"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteCustomerAction } from "@/app/actions/customers"
import { toast } from "sonner"
import ConfirmModal from "../reusable/ConfirmModal"
import { TrashIcon } from "../reusable/Icons"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export function CustomersList({ customers }: { customers: Customer[] }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = (id: string) => {
    setCustomerToDelete(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return

    setIsDeleting(true)
    try {
      await deleteCustomerAction(customerToDelete)
      toast.success("Cliente deletado com sucesso!")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao deletar cliente")
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setCustomerToDelete(null)
    }
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda</p>
          <Button asChild>
            <Link href="/erp/customers/new">Adicionar primeiro cliente</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/erp/customers/${customer.id}`}>Editar</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
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
            setCustomerToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Excluir cliente?"
          message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
          confirmText={isDeleting ? "Excluindo..." : "Excluir"}
          icon={<TrashIcon />}
          isDestructive
          disabled={isDeleting}
        />
      )}
    </>
  )
}
