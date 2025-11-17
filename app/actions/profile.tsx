"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateProfileAction(data: {
  userId: string
  fullName?: string
  phone?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}) {
  const supabase = await createClient()

  const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", data.userId).single()

  const updateData: any = {
    full_name: data.fullName ?? existingProfile?.full_name ?? "",
    phone: data.phone ?? existingProfile?.phone ?? "",
    zip_code: data.zipCode ?? existingProfile?.zip_code ?? "",
    street: data.street ?? existingProfile?.street ?? "",
    number: data.number ?? existingProfile?.number ?? "",
    complement: data.complement ?? existingProfile?.complement ?? "",
    neighborhood: data.neighborhood ?? existingProfile?.neighborhood ?? "",
    city: data.city ?? existingProfile?.city ?? "",
    state: data.state ?? existingProfile?.state ?? "",
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("profiles").update(updateData).eq("id", data.userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function requestEmailChangeAction(userId: string, newEmail: string) {
  const supabase = await createClient()

  // Verificar apenas na tabela profiles se o email já existe
  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", newEmail).maybeSingle() // Usando maybeSingle() ao invés de single() para evitar erro 406

  if (existingProfile) {
    return { error: "Este email já está em uso" }
  }

  // Gerar código OTP de 6 dígitos
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Armazenar OTP temporariamente (válido por 10 minutos)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: otpError } = await supabase.from("email_change_otps").upsert(
    {
      user_id: userId,
      new_email: newEmail,
      otp_code: otp,
      expires_at: expiresAt,
      attempts: 0,
    },
    {
      onConflict: "user_id",
    },
  )

  if (otpError) {
    return { error: "Erro ao gerar código de verificação" }
  }

  // Aqui você enviaria o email com o código OTP
  // Por enquanto, vou apenas logar no console para testes
  console.log(`[v0] OTP para ${newEmail}: ${otp}`)

  // Em produção, você usaria um serviço de email como Resend, SendGrid, etc.
  // Exemplo:
  // await sendEmail({
  //   to: newEmail,
  //   subject: "Código de verificação para alteração de email",
  //   html: `<p>Seu código de verificação é: <strong>${otp}</strong></p>`
  // })

  return { success: true }
}

export async function verifyEmailChangeAction(userId: string, newEmail: string, otpCode: string) {
  const supabase = await createClient()

  // Buscar OTP armazenado
  const { data: otpData, error: otpFetchError } = await supabase
    .from("email_change_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("new_email", newEmail)
    .single()

  if (otpFetchError || !otpData) {
    return { error: "Código de verificação não encontrado" }
  }

  // Verificar se expirou
  if (new Date(otpData.expires_at) < new Date()) {
    await supabase.from("email_change_otps").delete().eq("user_id", userId)
    return { error: "Código expirado. Solicite um novo código" }
  }

  // Verificar tentativas
  if (otpData.attempts >= 3) {
    await supabase.from("email_change_otps").delete().eq("user_id", userId)
    return { error: "Muitas tentativas. Solicite um novo código" }
  }

  // Verificar código
  if (otpData.otp_code !== otpCode) {
    // Incrementar tentativas
    await supabase
      .from("email_change_otps")
      .update({ attempts: otpData.attempts + 1 })
      .eq("user_id", userId)

    return { error: "Código inválido" }
  }

  // Código correto! Atualizar email
  const { error: updateError } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (updateError) {
    return { error: "Erro ao atualizar email: " + updateError.message }
  }

  // Atualizar na tabela profiles
  await supabase.from("profiles").update({ email: newEmail }).eq("id", userId)

  // Deletar OTP usado
  await supabase.from("email_change_otps").delete().eq("user_id", userId)

  return { success: true }
}
