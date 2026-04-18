import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const { nom, entreprise, niche, besoin, site } = await req.json() as {
      nom: string
      entreprise: string
      niche: string
      besoin: string
      site: string
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const hasSite = site && site.trim() !== ''

    const prompt = `Tu es un expert en cold call B2B pour une agence web. Génère un script de cold call percutant et naturel en français pour vendre une prestation de création/refonte de site web professionnel.

Informations sur le prospect :
- Nom : ${nom || 'le/la responsable'}
- Entreprise : ${entreprise || "l'entreprise"}
- Secteur : ${niche}
${besoin ? `- Besoin identifié : ${besoin}` : ''}
${hasSite ? `- Site actuel : ${site} (site existant à améliorer)` : '- Pas de site web détecté'}

Génère un script structuré avec ces parties :
1. **Accroche** (5 sec) — phrase d'entrée directe et percutante
2. **Présentation rapide** (10 sec) — qui tu es, pourquoi tu appelles
3. **Hook personnalisé** (15 sec) — problème spécifique à leur secteur/situation lié au site web
4. **Proposition de valeur** (20 sec) — ce que tu peux leur apporter concrètement
5. **Objection fréquente** — comment gérer "j'ai pas le temps / je suis pas intéressé"
6. **Clôture** — proposition d'un RDV de 15 min

Le ton doit être : direct, confiant, humain (pas robotique). Utilise le prénom si disponible. Adapte le discours au secteur ${niche}. Pas de jargon technique excessif.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return new Response(
        JSON.stringify({ error: 'Erreur API Claude', details: err }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const data = await res.json()
    const text = data.content[0].text

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('[ai-cold-call] Erreur:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur interne', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
