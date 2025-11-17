"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { ShoppingCart } from "lucide-react"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [isPartner, setIsPartner] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.full_name) {
              setUserName(profile.full_name)
            } else {
              setUserName(data.user.user_metadata?.full_name || data.user.email || "Usuário")
            }
          })

        // Verificar se é parceiro
        supabase
          .from("partners")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle()
          .then(({ data: partner }) => {
            setIsPartner(!!partner)
          })

        supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", data.user.id)
          .then(({ data: items }) => {
            const total = items?.reduce((sum, item) => sum + item.quantity, 0) || 0
            setCartCount(total)
          })
      }
    })

    // Carregar tema salvo
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handlePartnerClick = () => {
    if (isPartner) {
      router.push("/erp/dashboard")
    } else if (user) {
      router.push("/become-partner")
    } else {
      router.push("/auth/sign-up?partner=true")
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Lookali
        </Link>

        <nav className="flex items-center gap-4">
          <Button onClick={handlePartnerClick} variant="outline">
            {isPartner ? "Central do Parceiro" : "Seja Parceiro"}
          </Button>

          {user && (
            <Button asChild variant="outline" className="relative bg-transparent">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">{userName}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-orders">Meus Pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cart">Carrinho</Link>
                </DropdownMenuItem>
                {isPartner && (
                  <DropdownMenuItem asChild>
                    <Link href="/erp/dashboard">Central do Parceiro</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  Tema: {theme === "light" ? "Claro" : "Escuro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
