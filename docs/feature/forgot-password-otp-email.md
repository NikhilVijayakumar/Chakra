# Forgot Password OTP via Email Feature

## 1. Feature Overview
Implements 6-digit OTP-based password recovery for Chakra following the 3-step flow from `todo.md`:
1. **Request Code**: User enters email → OTP generated and sent via AgentMail
2. **Verify Code**: User enters OTP → validated against bcrypt hash in Prana
3. **Reset Password**: User sets new password → stored in Prana

OTP delivery is mandatory for this flow (email failure blocks user progress, exception to general "email optional" principle).

## 2. Architecture
```
Chakra (Consuming App)
├─ .env (AGENTMAIL_API_KEY, SYSTEM_INBOX_ID)
├─ src/templates/ (Handlebars OTP templates)
├─ Template Renderer (loads/compiles Handlebars templates) ← via Astra PR
├─ Forgot Password Logic (3-step flow: request → verify → reset)
└─ Configures Prana Services
    ├─ Email API (passes API key, inbox ID, template renderer) ← Prana PR #1
    └─ Auth Service (OTP generation, verification, password reset) ← Prana PR #2
        ↓
AgentMail (system-bavans@agentmail.to inbox)
    ↓
User Email
```

## 3. Key Decisions
| Decision | Resolution |
|----------|-------------|
| OTP Storage | Reuse Prana's existing `tempPasswordHash` (store bcrypt-hashed 6-digit OTP) + `tempPasswordExpiresAt` (5-minute TTL) in `AuthStoreRecord` |
| OTP Spec | 6-digit numeric, hashed with bcrypt before storage (cross-device validation compatible) |
| Delivery | OTP *only* via email: if AgentMail send fails, block user flow |
| Inbox | Use system inbox `system-bavans@agentmail.to` for OTP emails |
| Template Ownership | Templates stored in Chakra (not Prana), template renderer from Astra passed to Prana as prop |
| Env Handling | AgentMail credentials stored in Chakra's `.env`, passed to Prana as config props |
| Logic Ownership | Forgot password OTP logic lives in Chakra UI, Prana provides backend APIs |

## 4. OTP Specification
- **Format**: 6-digit numeric (e.g., `123456`)
- **Expiry**: 5 minutes (300,000 ms)
- **Storage**: Hashed with bcrypt (10 rounds) in `tempPasswordHash`, expiry timestamp in `tempPasswordExpiresAt`
- **Validation**: Compare user-input OTP hash with stored `tempPasswordHash` using bcrypt.compare

## 5. Chakra Implementation Steps (3-Step Flow)

### Step 1: Request OTP Code
**IPC Call**: `window.api.auth.forgotPassword(email)`
- Chakra calls Prana's `forgotPassword(email)`
- Prana generates 6-digit OTP, hashes with bcrypt
- Stores hash in `tempPasswordHash`, sets `tempPasswordExpiresAt`
- Sends OTP via Prana's email API (AgentMail)
- Returns `{ success: boolean, message: string }`

**UI State**: `useForgotPasswordViewModel.ts`
```typescript
const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
const [otp, setOtp] = useState('');
```

### Step 2: Verify OTP Code
**IPC Call**: `window.api.auth.verifyOtp(otp)`
- Chakra calls Prana's `verifyOtp(otp)` (NEW in Prana PR #2)
- Prana compares bcrypt hash with stored `tempPasswordHash`
- Returns `{ success: boolean, reason?: string }`

**UI State**:
```typescript
const handleVerifyOtp = async () => {
  const result = await repo.verifyOtp(otp);
  if (result.data) {
    setStep('reset');
  }
};
```

### Step 3: Reset Password
**IPC Call**: `window.api.auth.resetPassword(newPassword)`
- Chakra calls Prana's `resetPassword(newPassword)`
- Prana validates OTP was verified, checks password requirements
- Stores new password hash, clears OTP data
- Returns `{ success: boolean, message: string }`

### 5.1 Environment Setup
Add to Chakra's `.env`:
```env
AGENTMAIL_API_KEY=your_agentmail_api_key
SYSTEM_INBOX_ID=system-bavans@agentmail.to
```

### 5.2 Template Setup
Create `src/templates/otp-email.hbs` (inline CSS, Handlebars syntax):
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .otp-container { padding: 20px; background: #f5f5f5; }
        .otp-code { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .expiry { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="otp-container">
        <h2>Your OTP Code</h2>
        <p class="otp-code">{{otpCode}}</p>
        <p>This code expires in <span class="expiry">5 minutes</span>.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>
```

### 5.3 Template Renderer (via Astra)
```typescript
// Chakra main process
import { configureTemplateRenderer, renderTemplate } from 'astra/services/templateRenderer';

configureTemplateRenderer({
  basePath: path.join(__dirname, '../templates')
});

// Wrapper to match Prana's expected signature
async function chakraTemplateRenderer(templateName: string, data: any): Promise<string> {
    const result = await renderTemplate({ templateName, data });
    if (!result.success) throw new Error(result.error);
    return result.html!;
}
```

### 5.4 Configure Prana Email API
```typescript
// Chakra main process
import { configureEmailService } from 'prana/main/services/emailService';
import { AGENTMAIL_API_KEY, SYSTEM_INBOX_ID } from './config/env';

configureEmailService({
    apiKey: AGENTMAIL_API_KEY,
    inboxId: SYSTEM_INBOX_ID,
    templateRenderer: chakraTemplateRenderer
});
```

## 6. Prana PRs Required

### PR #1: General Email API (`general-email-api.md`)
- New files: `emailService.ts`, `email.types.ts`
- API: `configureEmailService()`, `sendEmail()`
- Add `agentmail` SDK dependency
- Location: `E:\Python\Chakra\docs\pr\prana\general-email-api.md`

### PR #2: OTP Verification (`otp-verification.md`)
- Modified: `authService.ts` (OTP generation + `verifyOtp()` method)
- Modified: `ipcService.ts` (add `auth:verify-otp` handler)
- Modified: `AuthRepo.ts` (add `verifyOtp()` method)
- Modified: `useForgotPasswordViewModel.ts` (3-step flow)
- Location: `E:\Python\Chakra\docs\pr\prana\otp-verification.md`

## 7. Astra PR Required

### PR: Template Renderer (`template-renderer.md`)
- New files: `templateRenderer.ts`, `template.types.ts`
- Utility: `configureTemplateRenderer()`, `renderTemplate()`
- Add `handlebars` dependency
- Location: `E:\Python\Chakra\docs\pr\astra\template-renderer.md`

## 8. IPC Calls (Cross-Ref with todo.md)
```typescript
// Step 1: Request OTP
window.api.auth.forgotPassword(email)
→ ipcService: 'auth:forgot-password'
→ authService.forgotPassword(email) // Generates OTP, sends email

// Step 2: Verify OTP (NEW - not in original todo.md)
window.api.auth.verifyOtp(otp)
→ ipcService: 'auth:verify-otp' (NEW)
→ authService.verifyOtp(otp) // Compares bcrypt hash

// Step 3: Reset Password
window.api.auth.resetPassword(newPassword)
→ ipcService: 'auth:reset-password'
→ authService.resetPassword(newPassword) // Validates OTP verified
```

## 9. Testing Plan
### Unit Tests
- OTP generation (6-digit numeric)
- OTP hashing/verification (bcrypt)
- `verifyOtp()` success/failure scenarios
- Template renderer output validation
- Prana email API configuration

### E2E Tests
- Full flow: enter email → OTP sent → enter correct OTP → reset password (success)
- Wrong OTP entered → verification fails, stay on OTP step
- Wait 5+ minutes → OTP expires → verification fails
- Email failure scenario: AgentMail API key invalid → user blocked

## 10. Dependencies
- **Prana**: Add `agentmail` SDK to dependencies
- **Astra**: Add `handlebars` to dependencies for template rendering
- **Chakra**: No new dependencies (uses Astra + Prana)

## 11. References
- `todo.md`: Original 3-step flow specification
- `docs/pr/prana/general-email-api.md`: Email API PR
- `docs/pr/prana/otp-verification.md`: OTP verification PR
- `docs/pr/astra/template-renderer.md`: Template renderer PR
