# Feature: Authentication

## Overview

Local authentication required before virtual drive access. Based on Dhi's auth flow.

## What It Does

- **Validates** user credentials
- **Creates** session for logged-in user
- **Determines** user role
- **Protects** virtual drive access

## What It Does NOT

- Does not integrate with external OAuth (future)
- Does not create accounts (admin-only)

## Login Flow (From Dhi)

Chakra follows Dhi's login flow:

```
1. User enters credentials
2. Validate against SQLite cache
3. Create session
4. Determine role
5. Grant access to virtual drive
```

For detailed flow, see Dhi docs:
- `E:\Python\dhi\docs\features\auth\login.md`
- `E:\Python\dhi\docs\features\bootstrap\splash-system-initialization.md`

## Dependencies

### Prana Services
- `authService` - Authentication
- `authStoreService` - Credential storage
- `volatileSessionStore` - Session store

### Local Services
- `chakraAuthService` - Chakra-specific auth

## Implementation

**IPC Handlers:**
- `auth:login` - Login with credentials
- `auth:logout` - Logout
- `auth:session` - Check session
- `auth:role` - Get user role

## Credential Storage

Credentials stored in SQLite cache:

```json
{
  "users": [
    {
      "id": "user-id",
      "username": "admin",
      "passwordHash": "bcrypt hash",
      "role": "admin"
    }
  ]
}
```

Passwords hashed with **bcrypt** before storage.

## Security

| Layer | Mechanism |
|------|-----------|
| Password | bcrypt hash |
| Session | Memory-resident |
| Storage | SQLite (local only, never synced) |

## Known Gaps

- [ ] OAuth integration
- [ ] Password reset (uses Dhi flow)
- [ ] Multi-factor auth

## Related Features

- [Governance](governance/index.md) - Role-based access
- [Virtual Drive](virtual-drive/index.md) - Mounted after login