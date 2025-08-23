/**
 * LINE OAuth 2.0 Client
 * Framework-agnostic implementation for LINE authentication
 */

import {
  LineAuthConfig,
  LineAuthorizationParams,
  LineTokenResponse,
  LineUserProfile,
  LineTokenRequest,
  LineAuthError,
  LineError
} from './types'

export class LineAuthClient {
  private readonly config: LineAuthConfig
  private readonly authorizationUrl = 'https://access.line.me/oauth2/v2.1/authorize'
  private readonly tokenUrl = 'https://api.line.me/oauth2/v2.1/token'
  private readonly userProfileUrl = 'https://api.line.me/v2/profile'
  private readonly revokeUrl = 'https://api.line.me/oauth2/v2.1/revoke'

  constructor(config: LineAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || 'profile'
    }
  }

  /**
   * Generate authorization URL for LINE login
   */
  getAuthorizationUrl(params: Partial<LineAuthorizationParams> = {}): string {
    const url = new URL(this.authorizationUrl)
    
    const authParams: LineAuthorizationParams = {
      responseType: 'code',
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      state: params.state || this.generateState(),
      scope: params.scope || this.config.scope,
      ...params
    }

    // Add parameters to URL
    Object.entries(authParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(
          this.camelToSnake(key),
          value.toString()
        )
      }
    })

    return url.toString()
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<LineTokenResponse> {
    const params: LineTokenRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    }

    return this.requestToken(params)
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<LineTokenResponse> {
    const params: LineTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    }

    return this.requestToken(params)
  }

  /**
   * Get user profile with access token
   */
  async getUserProfile(accessToken: string): Promise<LineUserProfile> {
    const response = await fetch(this.userProfileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json() as LineError
      throw new LineAuthError(
        error.error_description || 'Failed to get user profile',
        error.error,
        response.status
      )
    }

    return response.json() as Promise<LineUserProfile>
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(accessToken: string): Promise<void> {
    const response = await fetch(this.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        access_token: accessToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    })

    if (!response.ok) {
      const error = await response.json() as LineError
      throw new LineAuthError(
        error.error_description || 'Failed to revoke token',
        error.error,
        response.status
      )
    }
  }

  /**
   * Verify state parameter for CSRF protection
   */
  verifyState(state: string, expectedState: string): boolean {
    return state === expectedState
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    const array = new Uint8Array(32)
    if (typeof crypto !== 'undefined') {
      crypto.getRandomValues(array)
    } else {
      // Fallback for Node.js environments
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { randomBytes } = require('crypto')
      const buffer = randomBytes(32)
      array.set(buffer)
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Request token from LINE API
   */
  private async requestToken(params: LineTokenRequest): Promise<LineTokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params as unknown as Record<string, string>)
    })

    if (!response.ok) {
      const error = await response.json() as LineError
      throw new LineAuthError(
        error.error_description || 'Failed to get access token',
        error.error,
        response.status
      )
    }

    return response.json() as Promise<LineTokenResponse>
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}