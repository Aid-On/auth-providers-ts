/**
 * Example: Using @aid-on/auth-providers in GCP Cloud Functions
 */

import { createLineAuthHandler } from '@aid-on/auth-providers/line'
import type { Request, Response } from '@google-cloud/functions-framework'

// Initialize LINE Auth handler
const lineAuth = createLineAuthHandler({
  clientId: process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
  redirectUri: 'https://your-domain.com/api/auth/callback/line'
})

/**
 * Cloud Function: Start LINE authentication
 */
export async function startLineAuth(req: Request, res: Response) {
  try {
    const { authUrl, state } = lineAuth.startAuth()
    
    // Save state to session/cookie for CSRF protection
    res.cookie('line_auth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 10 * 1000 // 10 minutes
    })
    
    // Redirect to LINE auth page
    res.redirect(authUrl)
  } catch (error) {
    console.error('Auth start error:', error)
    res.status(500).json({ error: 'Failed to start authentication' })
  }
}

/**
 * Cloud Function: Handle LINE callback
 */
export async function handleLineCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query as { code: string; state: string }
    const expectedState = req.cookies.line_auth_state
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing parameters' })
    }
    
    // Exchange code for tokens and get user profile
    const { user, tokens } = await lineAuth.handleCallback({
      code,
      state,
      expectedState
    })
    
    // Here you would typically:
    // 1. Save user to database
    // 2. Create session
    // 3. Generate JWT token
    
    // Example response
    res.json({
      success: true,
      user: {
        id: user.userId,
        name: user.displayName,
        picture: user.pictureUrl
      },
      // In production, don't expose tokens directly
      accessToken: tokens.access_token
    })
  } catch (error) {
    console.error('Callback error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * Cloud Function: Get user profile with access token
 */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }
    
    const accessToken = authHeader.slice(7)
    const profile = await lineAuth.getProfile(accessToken)
    
    res.json({
      id: profile.userId,
      name: profile.displayName,
      picture: profile.pictureUrl,
      statusMessage: profile.statusMessage
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

/**
 * Cloud Function: Refresh access token
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' })
    }
    
    const tokens = await lineAuth.refreshToken(refreshToken)
    
    res.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
}