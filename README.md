# @aid-on/auth-providers

Framework-agnostic OAuth 2.0 authentication providers by Aid-On.

This library can be used in:
- Cloud Functions (GCP, AWS Lambda)
- Edge Functions (Vercel, Cloudflare Workers)
- Next.js API Routes
- Express/Fastify servers
- Client-side (with proper security measures)

## Installation

```bash
npm install @aid-on/auth-providers
# or
yarn add @aid-on/auth-providers
```

## Usage

### Cloud Functions Example

```typescript
import { createLineAuthHandler } from '@aid-on/auth-providers/line'

const lineAuth = createLineAuthHandler({
  clientId: process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
  redirectUri: 'https://your-domain.com/api/auth/callback'
})

// Start authentication
export async function startAuth(req: Request) {
  const { authUrl, state } = lineAuth.startAuth()
  
  // Save state to session/cookie for CSRF protection
  const response = Response.redirect(authUrl)
  response.headers.set('Set-Cookie', `auth_state=${state}; HttpOnly; Secure; SameSite=Lax`)
  
  return response
}

// Handle callback
export async function handleCallback(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')!
  const state = url.searchParams.get('state')!
  
  // Get expected state from cookie
  const expectedState = getCookie(req, 'auth_state')
  
  const { user, tokens } = await lineAuth.handleCallback({
    code,
    state,
    expectedState
  })
  
  // Save user and tokens to your database
  await saveUser(user)
  await saveTokens(tokens)
  
  return Response.json({ success: true, user })
}
```

### Direct Client Usage

```typescript
import { LineAuthClient } from '@aid-on/auth-providers/line'

const client = new LineAuthClient({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://your-domain.com/callback'
})

// Generate authorization URL
const state = client.generateState()
const authUrl = client.getAuthorizationUrl({ state })

// Exchange code for tokens
const tokens = await client.getAccessToken(code)

// Get user profile
const user = await client.getUserProfile(tokens.access_token)

// Refresh token
const newTokens = await client.refreshAccessToken(tokens.refresh_token)

// Revoke token
await client.revokeAccessToken(tokens.access_token)
```

## Available Providers

### LINE
Full OAuth 2.0 implementation for LINE Login

- Authorization URL generation
- Token exchange
- User profile retrieval
- Token refresh
- Token revocation

## Security Considerations

1. **Never expose client secrets in client-side code**
2. **Always validate state parameter for CSRF protection**
3. **Store tokens securely (encrypted in database)**
4. **Use HTTPS for all OAuth callbacks**
5. **Implement proper session management**

## License

MIT