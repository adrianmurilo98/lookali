import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Obrigado por se cadastrar!</CardTitle>
            <CardDescription>Verifique seu email</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enviamos um email de confirmação. Por favor, verifique sua caixa de entrada antes de fazer login.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
