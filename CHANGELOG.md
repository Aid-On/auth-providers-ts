# Changelog

All notable changes to @aid-on/auth-providers will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-XX

### Added
- Initial release
- LINE OAuth 2.0 authentication client
- Framework-agnostic implementation
- Support for Cloud Functions (GCP, AWS Lambda)
- TypeScript definitions
- CSRF protection with state management
- Token refresh and revocation support
- Comprehensive error handling

### Features
- `LineAuthClient` - Core authentication client
- `LineAuthHandler` - Request handler for serverless environments
- Full OAuth 2.0 flow implementation
- User profile retrieval
- Token management (access, refresh, revoke)

### Security
- Built-in CSRF protection
- Secure state generation
- Token validation

[0.1.0]: https://github.com/Aid-On/auth-providers-ts/releases/tag/v0.1.0