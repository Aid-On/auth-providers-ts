/**
 * LINE Auth Handler for Cloud Functions / Serverless
 */

import { LineAuthClient } from './client'
import { LineAuthConfig, LineUserProfile, LineTokenResponse } from './types'

export interface LineAuthHandlerConfig extends LineAuthConfig {
  onSuccess?: (user: LineUserProfile, tokens: LineTokenResponse) => Promise<void>
  onError?: (error: Error) => Promise<void>
}

export interface AuthStartResponse {
  authUrl: string
  state: string
}

export interface AuthCallbackParams {
  code: string
  state: string
  expectedState?: string
}

export interface AuthCallbackResponse {
  user: LineUserProfile
  tokens: LineTokenResponse
}

/**
 * Create a LINE authentication handler for serverless environments
 */
export function createLineAuthHandler(config: LineAuthHandlerConfig) {
  const client = new LineAuthClient(config)

  return {
    /**
     * Start authentication flow
     * Returns authorization URL and state for CSRF protection
     */
    startAuth(params?: { state?: string; nonce?: string }): AuthStartResponse {
      const state = params?.state || client.generateState()
      const authUrl = client.getAuthorizationUrl({
        state,
        nonce: params?.nonce
      })

      return {
        authUrl,
        state
      }
    },

    /**
     * Handle callback from LINE
     * Exchange code for tokens and get user profile
     */
    async handleCallback(params: AuthCallbackParams): Promise<AuthCallbackResponse> {
      // Verify state if provided
      if (params.expectedState && !client.verifyState(params.state, params.expectedState)) {
        throw new Error('Invalid state parameter')
      }

      // Exchange code for tokens
      const tokens = await client.getAccessToken(params.code)
      
      // Get user profile
      const user = await client.getUserProfile(tokens.access_token)

      // Call success handler if provided
      if (config.onSuccess) {
        await config.onSuccess(user, tokens)
      }

      return {
        user,
        tokens
      }
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<LineTokenResponse> {
      return client.refreshAccessToken(refreshToken)
    },

    /**
     * Get user profile with access token
     */
    async getProfile(accessToken: string): Promise<LineUserProfile> {
      return client.getUserProfile(accessToken)
    },

    /**
     * Revoke access token
     */
    async revokeToken(accessToken: string): Promise<void> {
      return client.revokeAccessToken(accessToken)
    },

    /**
     * Get the underlying client instance
     */
    getClient(): LineAuthClient {
      return client
    }
  }
}

/**
 * Example usage in Cloud Functions:
 * 
 * ```typescript
 * import { createLineAuthHandler } from '@aid-on/auth-providers/line'
 * 
 * const lineAuth = createLineAuthHandler({
 *   clientId: process.env.LINE_CLIENT_ID!,
 *   clientSecret: process.env.LINE_CLIENT_SECRET!,
 *   redirectUri: 'https://your-domain.com/api/auth/callback',
 *   onSuccess: async (user, tokens) => {
 *     // Save user to database
 *     await saveUser(user)
 *     // Save tokens securely
 *     await saveTokens(tokens)
 *   }
 * })
 * 
 * // Start auth endpoint
 * export async function startAuth(req: Request) {
 *   const { authUrl, state } = lineAuth.startAuth()
 *   // Save state to session/cookie
 *   return Response.redirect(authUrl)
 * }
 * 
 * // Callback endpoint
 * export async function handleCallback(req: Request) {
 *   const url = new URL(req.url)
 *   const code = url.searchParams.get('code')!
 *   const state = url.searchParams.get('state')!
 *   
 *   const { user, tokens } = await lineAuth.handleCallback({
 *     code,
 *     state,
 *     expectedState: getStateFromSession()
 *   })
 *   
 *   return Response.json({ user })
 * }
 * ```
 */