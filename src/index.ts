/**
 * @aid-on/auth-providers
 * Core authentication providers library (framework agnostic)
 * 
 * This library provides OAuth 2.0 implementations that can be used:
 * - In Cloud Functions (GCP, AWS Lambda, etc.)
 * - In Edge Functions (Vercel, Cloudflare Workers)
 * - In Client Components (with proper security considerations)
 * - As a base for framework-specific adapters (NextAuth.js, Supabase Auth, etc.)
 */

// LINE Provider
export * from './line'

// Future providers can be added here:
// export * from './google'
// export * from './facebook'
// export * from './twitter'

// Re-export for convenience
export { LineAuthClient } from './line/client'
export { createLineAuthHandler } from './line/handler'