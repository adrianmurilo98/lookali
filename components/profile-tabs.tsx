"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { updateProfileAction, requestEmailChangeAction, verifyEmailChangeAction } from "@/app/actions/profile"
import { createClient } from "@/lib/supabase/client"

interface ProfileTabsProps {
  userId: string
  profile: any
  initialFullName?: string
  email: string
}

export function ProfileTabs({ userId, profile, initialFullName, email }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("account")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailOtp, setEmailOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendTimer, setResendTimer] = useState(0)

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const resendAttemptsRef = useRef(0)
  const nextResendTimeRef = useRef<number>(0)

  const [accountData, setAccountData] = useState({
    fullName: profile?.full_name || initialFullName || "",
    phone: profile?.phone || "",
    email: email,
  })

  const [addressData, setAddressData] = useState({
    zipCode: profile?.zip_code || "",
    street: profile?.street || "",
    number: profile?.number || "",
    complement: profile?.complement || "",
    neighborhood: profile?.neighborhood || "",
    city: profile?.city || "",
    state: profile?.state || "",
  })

  const [loadingCep, setLoadingCep] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (isChangingEmail && nextResendTimeRef.current > Date.now()) {
      const remainingSeconds = Math.ceil((nextResendTimeRef.current - Date.now()) / 1000)
      setResendTimer(remainingSeconds)
      setCanResend(false)
      startResendTimerFromRemaining(remainingSeconds)
    }
  }, [isChangingEmail])

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const handleCepBlur = async () => {
    const cep = addressData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setAddressData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }))
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSaveAccount = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!accountData.fullName.trim()) {
      setError("O nome completo é obrigatório")
      setIsLoading(false)
      return
    }

    const result = await updateProfileAction({
      userId,
      fullName: accountData.fullName,
      phone: accountData.phone,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess("Informações da conta atualizadas com sucesso!")
    }
    setIsLoading(false)
  }

  const handleSaveAddress = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (
      !addressData.zipCode ||
      !addressData.street ||
      !addressData.number ||
      !addressData.neighborhood ||
      !addressData.city ||
      !addressData.state
    ) {
      setError("Preencha todos os campos obrigatórios do endereço")
      setIsLoading(false)
      return
    }

    const result = await updateProfileAction({
      userId,
      zipCode: addressData.zipCode,
      street: addressData.street,
      number: addressData.number,
      complement: addressData.complement,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess("Endereço atualizado com sucesso!")
    }
    setIsLoading(false)
  }

  const handleChangePassword = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (passwordData.newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (!passwordData.currentPassword) {
      setError("Digite sua senha atual")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        setError("Senha atual incorreta")
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess("Senha alterada com sucesso!")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      }
    } catch (err) {
      setError("Erro ao alterar senha")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEmailChange = () => {
    setIsChangingEmail(true)
    setOtpSent(false)
    setNewEmail("")
    setEmailOtp("")
    setError(null)
    setSuccess(null)
  }

  const handleSendOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setError("Digite um email válido")
      return
    }

    if (nextResendTimeRef.current > Date.now()) {
      setError("Aguarde antes de enviar outro código")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await requestEmailChangeAction(userId, newEmail)

    if (result.error) {
      setError(result.error)
    } else {
      setOtpSent(true)
      setSuccess("Código enviado para o novo email!")

      resendAttemptsRef.current += 1
      const waitTime = resendAttemptsRef.current * 60 // 60s, 120s, 180s

      if (resendAttemptsRef.current >= 3) {
        setError("Limite de tentativas atingido. Tente novamente mais tarde")
        setCanResend(false)
        setIsLoading(false)
        return
      }

      startResendTimer(waitTime)
    }

    setIsLoading(false)
  }

  const startResendTimer = (seconds: number) => {
    nextResendTimeRef.current = Date.now() + seconds * 1000
    setCanResend(false)
    setResendTimer(seconds)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    timerIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          setCanResend(true)
          nextResendTimeRef.current = 0
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startResendTimerFromRemaining = (remainingSeconds: number) => {
    setCanResend(false)
    setResendTimer(remainingSeconds)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    timerIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          setCanResend(true)
          nextResendTimeRef.current = 0
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleVerifyOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError("Digite o código de 6 dígitos")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await verifyEmailChangeAction(userId, newEmail, emailOtp)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess("Email alterado com sucesso!")
      setAccountData({ ...accountData, email: newEmail })
      setIsChangingEmail(false)
      setOtpSent(false)
      setNewEmail("")
      setEmailOtp("")
      resendAttemptsRef.current = 0
      nextResendTimeRef.current = 0
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    setIsLoading(false)
  }

  const handleCancelEmailChange = () => {
    setIsChangingEmail(false)
    setOtpSent(false)
    setNewEmail("")
    setEmailOtp("")
    setError(null)
    setSuccess(null)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="account">Informações da Conta</TabsTrigger>
        <TabsTrigger value="address">Endereço</TabsTrigger>
        <TabsTrigger value="password">Segurança</TabsTrigger>
        <TabsTrigger value="two-factor">Autenticação 2FA</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingEmail ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Input id="email" type="email" value={accountData.email} disabled className="bg-muted" />
                    <Button type="button" variant="outline" onClick={handleStartEmailChange}>
                      Alterar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="newEmail">Novo email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="novo@email.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleSendOtp} disabled={isLoading || !canResend}>
                        {isLoading ? "Enviando..." : canResend ? "Enviar código" : `Aguarde (${resendTimer}s)`}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEmailChange}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Um código de verificação foi enviado para <strong>{newEmail}</strong>
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emailOtp">Código de verificação</Label>
                      <Input
                        id="emailOtp"
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleVerifyOtp} disabled={isLoading}>
                        {isLoading ? "Verificando..." : "Verificar código"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={!canResend || isLoading}
                      >
                        {canResend ? "Reenviar código" : `Reenviar (${resendTimer}s)`}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEmailChange}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                value={accountData.fullName}
                onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={accountData.phone}
                onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}

            {!isChangingEmail && (
              <Button onClick={handleSaveAccount} disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar alterações"}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="address">
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input
                id="zipCode"
                placeholder="00000-000"
                value={addressData.zipCode}
                onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                onBlur={handleCepBlur}
                disabled={loadingCep}
              />
              {loadingCep && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={addressData.street}
                onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={addressData.number}
                  onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={addressData.complement}
                  onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={addressData.neighborhood}
                onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  maxLength={2}
                  placeholder="SP"
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}

            <Button onClick={handleSaveAddress} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar endereço"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Senha atual *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova senha *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Digite a senha novamente"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}

            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? "Alterando..." : "Alterar senha"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="two-factor">
        <Card>
          <CardHeader>
            <CardTitle>Autenticação em Duas Etapas (2FA)</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione uma camada extra de segurança na sua conta usando um aplicativo autenticador.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
              <div className="flex gap-3">
                <div className="text-2xl">🔐</div>
                <div>
                  <h3 className="font-semibold text-sm">Proteja sua conta com 2FA</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quando ativado, você precisará confirmar sua identidade com um código de segurança além da sua
                    senha.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Aplicativo Autenticador</p>
                  <p className="text-xs text-muted-foreground">
                    Use Google Authenticator, Authy, Microsoft Authenticator, etc.
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Ativar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">SMS</p>
                  <p className="text-xs text-muted-foreground">Receba códigos por mensagem de texto</p>
                </div>
                <Button size="sm" variant="outline">
                  Ativar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Códigos de Recuperaç��o</p>
                  <p className="text-xs text-muted-foreground">Códigos únicos para usar se perder acesso ao seu 2FA</p>
                </div>
                <Button size="sm" variant="outline">
                  Gerar
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                <strong>Dica:</strong> Sempre salve seus códigos de recuperação em um local seguro. Você precisará deles
                se perder acesso ao seu dispositivo autenticador.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
