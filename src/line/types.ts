/**
 * LINE OAuth 2.0 Types
 */

export interface LineAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope?: string
}

export interface LineAuthorizationParams {
  responseType?: 'code'
  clientId: string
  redirectUri: string
  state: string
  scope?: string
  nonce?: string
  prompt?: 'consent'
  maxAge?: number
  uiLocales?: string
  botPrompt?: 'normal' | 'aggressive'
}

export interface LineTokenResponse {
  access_token: string
  expires_in: number
  id_token?: string
  refresh_token?: string
  scope: string
  token_type: 'Bearer'
}

export interface LineUserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export interface LineIdTokenPayload {
  iss: string
  sub: string
  aud: string
  exp: number
  iat: number
  nonce?: string
  amr?: string[]
  name?: string
  picture?: string
  email?: string
}

export interface LineTokenRequest {
  grant_type: 'authorization_code' | 'refresh_token'
  code?: string
  redirect_uri?: string
  client_id: string
  client_secret: string
  refresh_token?: string
}

export interface LineError {
  error: string
  error_description?: string
}

export class LineAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'LineAuthError'
  }
}