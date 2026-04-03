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
