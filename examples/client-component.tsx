/**
 * Example: Using @aid-on/auth-providers in React Client Component
 * Note: This requires server-side endpoints to handle OAuth flow securely
 */

import { useState, useEffect } from 'react'

// Client-side auth helper
class LineAuthHelper {
  private readonly authEndpoint: string
  private readonly callbackEndpoint: string
  
  constructor(baseUrl: string = '/api/auth') {
    this.authEndpoint = `${baseUrl}/line/start`
    this.callbackEndpoint = `${baseUrl}/line/callback`
  }
  
  /**
   * Start LINE authentication flow
   */
  startAuth() {
    window.location.href = this.authEndpoint
  }
  
  /**
   * Handle callback (call from callback page)
   */
  async handleCallback(): Promise<{ user: unknown; token: string }> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    
    if (!code || !state) {
      throw new Error('Missing authentication parameters')
    }
    
    const response = await fetch(this.callbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, state })
    })
    
    if (!response.ok) {
      throw new Error('Authentication failed')
    }
    
    return response.json()
  }
  
  /**
   * Get current user profile
   */
  async getProfile(accessToken: string) {
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }
    
    return response.json()
  }
}

// React Component Example
export function LoginButton() {
  const [loading, setLoading] = useState(false)
  const lineAuth = new LineAuthHelper()
  
  const handleLogin = () => {
    setLoading(true)
    lineAuth.startAuth()
  }
  
  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.04 2 10.97c0 4.05 3.07 7.47 7.28 8.63..." />
      </svg>
      {loading ? 'Redirecting...' : 'Login with LINE'}
    </button>
  )
}

// Callback Page Component
export function CallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [user, setUser] = useState<unknown>(null)
  
  useEffect(() => {
    const lineAuth = new LineAuthHelper()
    
    lineAuth.handleCallback()
      .then(({ user, token }) => {
        // Save token to localStorage or state management
        localStorage.setItem('line_access_token', token)
        setUser(user)
        setStatus('success')
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      })
      .catch(error => {
        console.error('Callback error:', error)
        setStatus('error')
      })
  }, [])
  
  if (status === 'processing') {
    return <div>Processing authentication...</div>
  }
  
  if (status === 'error') {
    return (
      <div>
        <p>Authentication failed</p>
        <button onClick={() => window.location.href = '/'}>
          Back to login
        </button>
      </div>
    )
  }
  
  return (
    <div>
      <p>Welcome, {(user as { name?: string })?.name}!</p>
      <p>Redirecting to dashboard...</p>
    </div>
  )
}

// Profile Component
export function UserProfile() {
  const [profile, setProfile] = useState<{ picture?: string; name?: string; id?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const token = localStorage.getItem('line_access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    
    const lineAuth = new LineAuthHelper()
    lineAuth.getProfile(token)
      .then(setProfile)
      .catch(error => {
        console.error('Profile fetch error:', error)
        // Token might be expired, redirect to login
        localStorage.removeItem('line_access_token')
        window.location.href = '/login'
      })
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) {
    return <div>Loading profile...</div>
  }
  
  return (
    <div className="flex items-center gap-4">
      {profile?.picture && (
        <img 
          src={profile.picture} 
          alt={profile.name}
          className="w-12 h-12 rounded-full"
        />
      )}
      <div>
        <p className="font-semibold">{profile?.name}</p>
        <p className="text-sm text-gray-600">{profile?.id}</p>
      </div>
    </div>
  )
}