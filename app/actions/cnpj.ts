"use server"

interface CNPjAResponse {
  taxId: string
  alias?: string
  founded?: string
  head?: boolean
  statusDate?: string
  status?: {
    id: number
    text: string
  }
  company: {
    id: number
    name: string
    equity: number
    nature: {
      id: number
      text: string
    }
    size: {
      id: number
      acronym: string
      text: string
    }
    simples?: {
      optant: boolean
      since: string | null
    }
    simei?: {
      optant: boolean
      since: string | null
    }
    members: Array<any>
  }
  address: {
    municipality: number
    street: string
    number: string
    details?: string
    district: string
    city: string
    state: string
    zip: string
    country: {
      id: number
      name: string
    }
  }
  phones?: Array<{
    type: string
    area: string
    number: string
  }>
  emails?: Array<{
    ownership: string
    address: string
    domain: string
  }>
  mainActivity: {
    id: number
    text: string
  }
  sideActivities?: Array<{
    id: number
    text: string
  }>
  registrations?: Array<{
    number: string
    state: string
    enabled: boolean
    statusDate: string
    status: {
      id: number
      text: string
    }
    type: {
      id: number
      text: string
    }
  }>
  suframa?: Array<{
    number: string
    since: string
    approved: boolean
    approvalDate: string
    status: {
      id: number
      text: string
    }
  }>
}

export async function fetchCNPJDataAction(cnpj: string) {
  const cleanCNPJ = cnpj.replace(/\D/g, "")

  if (cleanCNPJ.length !== 14) {
    return { error: "CNPJ deve ter 14 dígitos" }
  }

  try {
    const response = await fetch(`https://open.cnpja.com/office/${cleanCNPJ}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        error:
          response.status === 404
            ? "CNPJ não encontrado. Verifique o número digitado."
            : `Erro ao consultar CNPJ: ${response.status}`,
      }
    }

    const data: CNPjAResponse = await response.json()

    if (!data.company?.name) {
      return { error: "CNPJ inválido ou não encontrado" }
    }

    const normalStateReg = data.registrations?.find(r => r.type.id === 1 && r.enabled)
    const anyStateReg = data.registrations?.find(r => r.enabled)
    const stateReg = normalStateReg || anyStateReg

    const landlinePhone = data.phones?.find(p => p.type === 'LANDLINE')
    const anyPhone = data.phones?.[0]
    const phone = landlinePhone || anyPhone

    const corporateEmail = data.emails?.find(e => e.ownership === 'CORPORATE')
    const anyEmail = data.emails?.[0]
    const email = corporateEmail || anyEmail

    let regimeTributario = "Não definido"
    if (data.company.simei?.optant) {
      regimeTributario = "MEI"
    } else if (data.company.simples?.optant) {
      regimeTributario = "Simples nacional"
    } else if (data.company.size?.acronym === 'DEMAIS') {
      regimeTributario = "Regime normal"
    }

    const suframaNumber = data.suframa?.find(s => s.approved && s.status.id === 1)?.number || ""

    return {
      success: true,
      data: {
        // Basic company info
        razao_social: data.company.name,
        nome_fantasia: data.alias || data.company.name,
        
        // Tax information
        inscricao_estadual: stateReg?.number || "",
        inscricao_municipal: "", // Not provided by API
        suframa: suframaNumber,
        tributacao_regime: regimeTributario,
        
        // Company details
        natureza_juridica: data.company.nature?.text || "",
        porte: data.company.size?.text || "",
        capital_social: data.company.equity || 0,
        data_abertura: data.founded || "",
        situacao: data.status?.text || "",
        
        // Activities
        atividade_principal: data.mainActivity?.text || "",
        atividades_secundarias: data.sideActivities?.map(a => a.text).join(", ") || "",
        
        // Address
        logradouro: data.address.street,
        numero: data.address.number,
        complemento: data.address.details || "",
        bairro: data.address.district,
        municipio: data.address.city,
        uf: data.address.state,
        cep: data.address.zip.replace(/\D/g, ""),
        codigo_municipio: data.address.municipality?.toString() || "",
        
        // Contact
        telefone: phone ? `${phone.area}${phone.number}` : "",
        telefone_ddd: phone?.area || "",
        telefone_numero: phone?.number || "",
        email: email?.address || "",
        
        // All registrations for reference
        inscricoes_estaduais: data.registrations?.filter(r => r.enabled).map(r => ({
          numero: r.number,
          estado: r.state,
          tipo: r.type.text,
          ativo: r.enabled
        })) || [],
      },
    }
  } catch (error) {
    console.error("[CNPJ] Fetch error:", error)
    return {
      error: "Erro ao conectar com a API de CNPJ. Tente novamente ou preencha manualmente.",
    }
  }
}
