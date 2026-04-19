# Feature: Roles

## Overview

Role definitions and permissions for Chakra access control.

## Role Definitions

### Admin

| Permission | Description |
|------------|-------------|
| App Installation | Install any app |
| App Uninstall | Uninstall any app |
| Configuration | Modify all settings |
| Governance | Full SSH access |
| Storage | Full storage access |

### User

| Permission | Description |
|------------|-------------|
| App Installation | Install permitted apps only |
| App Uninstall | Uninstall own apps |
| Configuration | Own app settings only |
| Governance | Read access only |
| Storage | Limited storage access |

### Guest

| Permission | Description |
|------------|-------------|
| App Listing | View permitted apps |
| No Installation | Cannot install |
| No Configuration | View only |
| No Governance | No access |
| No Storage | No access |

## Role Hierarchy

```
Admin
  └── User
      └── Guest
```

Higher roles include all permissions of lower roles.

## Role Assignment

Roles are assigned based on:
1. Login credentials (local auth)
2. Governance repo permissions (SSH)

## Implementation

**Role Storage:** SQLite cache (`chakra.sqlite`)

```json
{
  "users": [
    {
      "id": "user-id",
      "username": "admin",
      "role": "admin",
      "createdAt": "2026-04-19T00:00:00Z"
    }
  ]
}
```

## Known Gaps

- [ ] Role management UI
- [ ] Role inheritance
- [ ] Custom roles

## Related Features

- [Governance](governance.md) - SSH governance
- [Authentication](authentication.md) - Login