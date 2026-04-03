import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/overview'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Ensure User record exists in Prisma DB
      await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email!, name: user.user_metadata?.name || null },
        create: { id: user.id, email: user.email!, name: user.user_metadata?.name || null },
      })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
