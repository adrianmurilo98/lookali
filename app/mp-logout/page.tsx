import { Suspense } from 'react'
import { MercadoPagoLogoutContent } from './logout-content'
import { Spinner } from '@/components/ui/spinner'

export default function MercadoPagoLogoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <MercadoPagoLogoutContent />
    </Suspense>
  )
}
