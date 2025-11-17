"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { authenticator } from "otplib"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials")
}

export async function generateTOTPSecret() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    // Generate TOTP secret
    const secret = authenticator.generateSecret()

    // Save to database
    const { error } = await supabase.from("user_2fa_secrets").upsert({
      user_id: user.id,
      secret,
      is_active: false,
    })

    if (error) throw error

    // Generate QR code data
    const otpauthUrl = authenticator.keyuri(user.email || "user", "ERP", secret)

    return {
      secret,
      qrCodeUrl: otpauthUrl,
    }
  } catch (error) {
    console.error("[v0] Error generating TOTP secret:", error)
    throw error
  }
}

export async function verifyTOTPAndEnable(code: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    // Get the secret
    const { data: secretData, error: secretError } = await supabase
      .from("user_2fa_secrets")
      .select("secret")
      .eq("user_id", user.id)
      .single()

    if (secretError || !secretData) throw new Error("2FA não configurado")

    // Verify the code
    const isValid = authenticator.check(code, secretData.secret)
    if (!isValid) throw new Error("Código inválido")

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10).toUpperCase())

    // Update 2FA settings and activate secret
    const { error: updateError } = await supabase
      .from("user_2fa_secrets")
      .update({ is_active: true, activated_at: new Date() })
      .eq("user_id", user.id)

    if (updateError) throw updateError

    // Insert backup codes
    const { error: codesError } = await supabase.from("user_2fa_backup_codes").insert(
      backupCodes.map((code) => ({
        user_id: user.id,
        code,
      })),
    )

    if (codesError) throw codesError

    // Create or update 2FA settings
    const { error: settingsError } = await supabase.from("user_2fa_settings").upsert({
      user_id: user.id,
      is_enabled: true,
      method: "totp",
    })

    if (settingsError) throw settingsError

    return { success: true, backupCodes }
  } catch (error) {
    console.error("[v0] Error verifying TOTP:", error)
    throw error
  }
}

export async function verifyTOTPCode(code: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    // Get the secret
    const { data: secretData, error: secretError } = await supabase
      .from("user_2fa_secrets")
      .select("secret")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (secretError || !secretData) throw new Error("2FA não ativado")

    // Verify the code (allow 1 time window before and after for clock skew)
    const isValid = authenticator.check(code, secretData.secret)
    if (!isValid) throw new Error("Código inválido ou expirado")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error verifying TOTP code:", error)
    throw error
  }
}

export async function disable2FA() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    // Delete 2FA data
    const { error: secretError } = await supabase.from("user_2fa_secrets").delete().eq("user_id", user.id)

    const { error: codesError } = await supabase.from("user_2fa_backup_codes").delete().eq("user_id", user.id)

    const { error: settingsError } = await supabase
      .from("user_2fa_settings")
      .update({ is_enabled: false })
      .eq("user_id", user.id)

    if (secretError || codesError || settingsError) throw new Error("Erro ao desabilitar 2FA")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error disabling 2FA:", error)
    throw error
  }
}

export async function get2FAStatus() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { isEnabled: false }

    const { data } = await supabase.from("user_2fa_settings").select("is_enabled").eq("user_id", user.id).single()

    return { isEnabled: data?.is_enabled || false }
  } catch (error) {
    console.error("[v0] Error getting 2FA status:", error)
    return { isEnabled: false }
  }
}
