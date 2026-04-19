# Feature: SSH Governance

## Overview

Role-based SSH access to governance repositories stored in the virtual drive.

## What It Does

- **Manages** SSH access to governance repos
- **Validates** user roles before access
- **Tracks** access in audit log
- **Synchronizes** governance data

## What It Does NOT

- Does not handle app installation (separate feature)
- Does not create new repositories

## Dependencies

### Prana Services
- `driveControllerService` - Virtual drive
- `vaultService` - Encrypted storage

### Local Services
- `sshGovernanceService` - SSH access management

## Implementation

**IPC Handlers:**
- `governance:access` - Check access permission
- `governance:sync` - Sync governance data
- `governance:audit` - Log access

## Governance Folder Structure

```
/mounted-drive/data/governance/
├── {repoName}/           # e.g., company-policies
│   ├── policies/
│   └── ...
└── {otherRepo}/
```

## Role-Based Access

| Role | Access Level |
|------|-------------|
| Admin | Full read/write |
| User | Read only |
| Guest | None |

## Security Model

1. User logs in (local auth)
2. Role determined from login
3. SSH access validated per role
4. Audit log updated

For detailed auth flow, see [Authentication](authentication/index.md).

## Integration with Dhi

This feature reuses the SSH governance approach from Dhi. See:
- Dhi docs: `E:\Python\dhi\docs\features\bootstrap\splash-system-initialization.md`

## Known Gaps

- [ ] SSH key management UI
- [ ] Automatic repo sync scheduling

## Related Features

- [Roles](roles.md) - Role definitions
- [Authentication](authentication/index.md) - Login security
- [Virtual Drive](virtual-drive/index.md) - Mounted storage