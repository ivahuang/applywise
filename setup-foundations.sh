#!/bin/bash
# ApplyWise Foundations Setup Script
# Run from your applewise root directory:
#   bash setup-foundations.sh

set -e

echo "🔧 Creating directories..."
mkdir -p src/lib/supabase
mkdir -p src/hooks
mkdir -p src/app/login
mkdir -p src/app/auth/callback
mkdir -p "src/app/api/applications/[id]"

# ============================================================
# 1. src/lib/supabase/client.ts
# ============================================================
echo "📄 Creating src/lib/supabase/client.ts"
cat > src/lib/supabase/client.ts << 'ENDOFFILE'
// Browser-side Supabase client (for client components)

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
ENDOFFILE

# ============================================================
# 2. src/lib/supabase/server.ts
# ============================================================
echo "📄 Creating src/lib/supabase/server.ts"
cat > src/lib/supabase/server.ts << 'ENDOFFILE'
// Server-side Supabase client (for API routes and server components)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignored, middleware handles refresh
          }
        },
      },
    }
  )
}

// Get current user or null
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Require auth — throws if not logged in
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  // Ensure user exists in Prisma DB
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email! },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
    },
  })
  return user
}
ENDOFFILE

# ============================================================
# 3. src/middleware.ts
# ============================================================
echo "📄 Creating src/middleware.ts"
cat > src/middleware.ts << 'ENDOFFILE'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
ENDOFFILE

# ============================================================
# 4. src/hooks/useAuth.ts
# ============================================================
echo "📄 Creating src/hooks/useAuth.ts"
cat > src/hooks/useAuth.ts << 'ENDOFFILE'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loading, signIn, signUp, signOut }
}
ENDOFFILE

# ============================================================
# 5. src/app/login/page.tsx
# ============================================================
echo "📄 Creating src/app/login/page.tsx"
cat > src/app/login/page.tsx << 'ENDOFFILE'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, name)
        setError('Check your email to confirm your account. 请查看邮箱确认账号。')
      } else {
        await signIn(email, password)
        router.push('/overview')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAF8F5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '2.5rem',
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E8E5DE',
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#2C3E2D', marginBottom: 4 }}>
            ApplyWise
          </h1>
          <p style={{ fontSize: 14, color: '#7C8B7D' }}>
            {isSignUp ? '创建账号 Create account' : '登录 Sign in'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#5A6B5B', marginBottom: 6 }}>
                姓名 Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="你的名字"
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #D4D1C7',
                  borderRadius: 8, fontSize: 15, outline: 'none', background: '#FAFAF8',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#5A6B5B', marginBottom: 6 }}>
              邮箱 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #D4D1C7',
                borderRadius: 8, fontSize: 15, outline: 'none', background: '#FAFAF8',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#5A6B5B', marginBottom: 6 }}>
              密码 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少6位"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #D4D1C7',
                borderRadius: 8, fontSize: 15, outline: 'none', background: '#FAFAF8',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{
              fontSize: 13, lineHeight: 1.5, marginBottom: 16,
              color: error.includes('Check your email') ? '#1D9E75' : '#D85A30',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 0', background: '#2C3E2D', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '...' : (isSignUp ? '注册 Sign up' : '登录 Sign in')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7C8B7D' }}>
          {isSignUp ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            style={{
              background: 'none', border: 'none', color: '#2C3E2D', fontWeight: 500,
              cursor: 'pointer', textDecoration: 'underline', fontSize: 13,
            }}
          >
            {isSignUp ? '去登录' : '注册'}
          </button>
        </p>
      </div>
    </div>
  )
}
ENDOFFILE

# ============================================================
# 6. src/app/auth/callback/route.ts
# ============================================================
echo "📄 Creating src/app/auth/callback/route.ts"
cat > src/app/auth/callback/route.ts << 'ENDOFFILE'
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
ENDOFFILE

# ============================================================
# 7. src/app/api/applications/route.ts
# ============================================================
echo "📄 Creating src/app/api/applications/route.ts"
cat > src/app/api/applications/route.ts << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

// GET: list user's applications
export async function GET() {
  try {
    const user = await requireAuth()

    const applications = await prisma.userApplication.findMany({
      where: { userId: user.id },
      include: {
        program: { include: { school: true } }
      },
      orderBy: { addedAt: 'asc' }
    })

    return NextResponse.json(applications)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST: add a program to user's list
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { programId, tier = 'target' } = body

    if (!programId) {
      return NextResponse.json({ error: 'programId required' }, { status: 400 })
    }

    const existing = await prisma.userApplication.findUnique({
      where: { userId_programId: { userId: user.id, programId } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Program already in your list' }, { status: 409 })
    }

    const application = await prisma.userApplication.create({
      data: {
        userId: user.id,
        programId,
        tier,
        tasksState: {},
      },
      include: {
        program: { include: { school: true } }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to add program' }, { status: 500 })
  }
}
ENDOFFILE

# ============================================================
# 8. src/app/api/applications/[id]/route.ts
# ============================================================
echo "📄 Creating src/app/api/applications/[id]/route.ts"
cat > "src/app/api/applications/[id]/route.ts" << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

// PATCH: update tier, status, tasksState, notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const app = await prisma.userApplication.findUnique({ where: { id } })
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const allowedFields: Record<string, any> = {}
    if (body.tier) allowedFields.tier = body.tier
    if (body.status) allowedFields.status = body.status
    if (body.tasksState !== undefined) allowedFields.tasksState = body.tasksState
    if (body.notes !== undefined) allowedFields.notes = body.notes

    const updated = await prisma.userApplication.update({
      where: { id },
      data: allowedFields,
      include: { program: { include: { school: true } } }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE: remove application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const app = await prisma.userApplication.findUnique({ where: { id } })
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.userApplication.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete application error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
ENDOFFILE

echo ""
echo "✅ All foundation files created!"
echo ""
echo "Next steps:"
echo "  1. npm install @supabase/ssr @supabase/supabase-js"
echo "  2. Replace prisma/schema.prisma with the new schema (download from Claude outputs)"
echo "  3. npx prisma db push"
echo "  4. npx prisma generate"
echo "  5. npm run dev"
echo ""
