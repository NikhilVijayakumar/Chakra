# Astra PR: Template Renderer + Email Templates

## PR Title
`feat: add Handlebars template renderer utility with email templates`

## 1. Overview
Adds a reusable Handlebars template renderer to Astra, allowing consuming applications (e.g., Chakra) to load, compile, and render Handlebars templates with injected data. Also includes a templates folder with base layout and email templates for forgot password OTP.

This utility will be used by Chakra's email service to render email templates provided by the consuming app, which Prana's email service can then send.

## 2. Key Design Decisions
| Decision | Resolution |
|----------|-------------|
| Utility Location | Added to Astra's `src/services/templateRenderer.ts` as a shared utility |
| Template Format | Handlebars (`*.hbs`) with support for any data injection |
| Templates Location | `src/templates/` (bundled with src, follows React/Vite standard) |
| CSS Handling | Inline CSS responsibility of template author (no automatic inlining) |
| File Loading | Templates loaded from filesystem via provided base path |
| No Dependencies on Prana | Standalone utility, no import of Prana-specific code |
| Exports | Export from `src/lib.ts` for consuming apps |

## 3. Changes to Astra

### 3.1 New Files
| File Path | Purpose |
|-----------|---------|
| `src/types/template.types.ts` | Type definitions for renderer input/output |
| `src/services/templateRenderer.ts` | Handlebars template loading, compilation, and rendering |
| `src/templates/base-layout.hbs` | Base HTML wrapper for all email templates |
| `src/templates/alert.hbs` | Reusable alert component template |
| `src/templates/task-summary.hbs` | Task summary component template |
| `src/templates/otp-email.hbs` | Forgot password OTP email template |

### 3.2 Modified Files
| File Path | Changes |
|-----------|---------|
| `package.json` | Add `handlebars` to dependencies |
| `src/lib.ts` | Export templateRenderer utilities |

## 4. API Specification

### 4.1 Type Definitions (`src/types/template.types.ts`)
```typescript
export interface TemplateRendererConfig {
    basePath: string;
}

export interface RenderTemplateOptions {
    templateName: string;
    data: any;
}

export interface RenderResult {
    success: boolean;
    html?: string;
    error?: string;
}

export interface TemplateRendererService {
    configure: (config: TemplateRendererConfig) => void;
    render: (options: RenderTemplateOptions) => Promise<RenderResult>;
}
```

### 4.2 Template Renderer (`src/services/templateRenderer.ts`)
```typescript
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import type { TemplateRendererConfig, RenderTemplateOptions, RenderResult } from '../types/template.types';

let config: TemplateRendererConfig | null = null;

export function configureTemplateRenderer(userConfig: TemplateRendererConfig): void {
    config = userConfig;
}

export async function renderTemplate(options: RenderTemplateOptions): Promise<RenderResult> {
    if (!config) {
        return {
            success: false,
            error: 'Template renderer not configured. Call configureTemplateRenderer first.'
        };
    }

    const { templateName, data } = options;
    const filePath = path.join(config.basePath, `${templateName}.hbs`);

    try {
        const source = await fs.readFile(filePath, 'utf-8');
        const compiled = handlebars.compile(source);
        const html = compiled(data);

        return {
            success: true,
            html
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error rendering template'
        };
    }
}

export const templateRenderer = {
    configure: configureTemplateRenderer,
    render: renderTemplate
};
```

### 4.3 Base Layout (`src/templates/base-layout.hbs`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #888;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        {{#if header}}
        <div class="header">
            <h1 style="margin: 0 0 16px 0; color: #1a1a1a;">{{header}}</h1>
        </div>
        {{/if}}
        {{> @partial-block }}
    </div>
    {{#if footer}}
    <div class="footer">
        {{footer}}
    </div>
    {{/if}}
</body>
</html>
```

### 4.4 Alert Component (`src/templates/alert.hbs`)
```html
{{#if show}}
<div style="
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    {{#ifEquals type 'warning'}}
    background: #fff3cd;
    border: 1px solid #ffc107;
    color: #856404;
    {{else ifEquals type 'error'}}
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    {{else ifEquals type 'success'}}
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    {{else}}
    background: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
    {{/ifEquals}}
">
    <strong>{{title}}</strong>
    <p style="margin: 8px 0 0 0;">{{message}}</p>
</div>
{{/if}}
```

### 4.5 Task Summary Component (`src/templates/task-summary.hbs`)
```html
<div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 16px 0;">
    <h3 style="margin: 0 0 12px 0; color: #333;">{{title}}</h3>
    {{#if tasks}}
    <ul style="margin: 0; padding-left: 20px;">
        {{#each tasks}}
        <li style="margin: 8px 0;">
            <span style="{{#ifEquals status 'completed'}}text-decoration: line-through; color: #888;{{else}}color: #333;{{/ifEquals}}">
                {{text}}
            </span>
            {{#if dueDate}}
            <span style="font-size: 12px; color: #888; margin-left: 8px;">Due: {{dueDate}}</span>
            {{/if}}
        </li>
        {{/each}}
    </ul>
    {{/if}}
</div>
```

### 4.6 OTP Email Template (`src/templates/otp-email.hbs`)
```html
{{#> base-layout title="Password Reset OTP"}}
<h2 style="margin: 0 0 16px 0; color: #333;">Reset Your Password</h2>

<p style="margin: 0 0 16px 0; color: #555;">
    We received a request to reset your password. Use the following OTP code to verify your identity:
</p>

<div style="
    background: #f5f5f5;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 24px 0;
">
    <span style="
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 4px;
        color: #1976d2;
    ">{{otpCode}}</span>
</div>

<p style="margin: 0 0 16px 0; color: #888; font-size: 14px;">
    This code will expire in {{expiryMinutes}} minutes.
</p>

{{#> alert type="warning" title="Security Note" message="If you didn't request this, please ignore this email or contact support."}}

<p style="margin: 0; color: #555; font-size: 14px;">
    Having trouble? Contact our support team for assistance.
</p>
{{/base-layout}}
```

## 5. Integration with Chakra

### 5.1 Chakra Integration (Documented Here)
Chakra will integrate with Astra's template renderer as follows:

```typescript
// Chakra: main process - configure template renderer
import { configureTemplateRenderer, renderTemplate } from 'astra/services/templateRenderer';
import path from 'path';

// Configure once at startup
configureTemplateRenderer({
    basePath: path.join(__dirname, '../node_modules/astra/templates')
});

// Chakra: wrapper to match Prana's expected signature
import type { EmailTemplateRenderer } from 'prana';

const chakraTemplateRenderer: EmailTemplateRenderer = async (templateName: string, data: any): Promise<string> => {
    const result = await renderTemplate({ templateName, data });
    if (!result.success) {
        throw new Error(result.error);
    }
    return result.html!;
};

// Pass to Prana
import { configureEmailService } from 'prana';

configureEmailService({
    apiKey: process.env.AGENTMAIL_API_KEY,
    inboxId: process.env.SYSTEM_INBOX_ID,
    templateRenderer: chakraTemplateRenderer
});
```

### 5.2 Chakra Usage Example
```typescript
// Chakra: sending OTP email via Prana
import { sendEmail } from 'prana';

await sendEmail({
    to: ['user@example.com'],
    subject: 'Password Reset OTP',
    template: 'otp-email',
    data: {
        otpCode: '123456',
        expiryMinutes: 5
    }
});
```

## 6. Testing Steps

### 6.1 Unit Tests
| Test | Description |
|------|-------------|
| Configure stores config correctly | Verify config is stored after `configureTemplateRenderer()` |
| Render loads and compiles template | Verify template file is loaded from basePath |
| Render injects data correctly | Verify Handlebars placeholders are replaced |
| Render handles missing template | Verify error returned when template doesn't exist |
| Render handles invalid Handlebars | Verify error returned for syntax errors |
| Template exports available | Verify all exports are in lib.ts |

### 6.2 Integration Tests
| Test | Description |
|------|-------------|
| OTP email renders correctly | Verify OTP code and expiry minutes are injected |
| Base layout wraps content | Verify content is wrapped in HTML structure |
| Alert component renders | Verify alert renders with correct type styling |

## 7. Dependencies Added
| Package | Version | Purpose |
|---------|---------|---------|
| handlebars | ^4.7.7 | Handlebars template engine |

## 8. Checklist
- [ ] Add `handlebars` to Astra `package.json`
- [ ] Create `src/types/template.types.ts`
- [ ] Create `src/services/templateRenderer.ts`
- [ ] Create `src/templates/base-layout.hbs`
- [ ] Create `src/templates/alert.hbs`
- [ ] Create `src/templates/task-summary.hbs`
- [ ] Create `src/templates/otp-email.hbs`
- [ ] Export from `src/lib.ts`
- [ ] Add unit tests for template renderer
- [ ] Test integration with Chakra + Prana email flow

## 9. Repro & Fix (Chakra)

**Issue encountered**

While building Chakra, the following runtime error was observed when importing the template renderer from Astra:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './services/templateRenderer' is not defined by "exports" in E:\\Python\\Chakra\\node_modules\\astra\\package.json
```

**Where it occurred (consumer)**

- `src/main/services/templateRenderer.ts` in the Chakra codebase imported the utility via a deep import:

```ts
import { configureTemplateRenderer, renderTemplate } from 'astra/services/templateRenderer'
```

**Local fix applied in this repo**

To avoid the package subpath export error, the Chakra import was changed to use Astra's public entrypoint (root export) instead of the deep subpath:

```ts
import { configureTemplateRenderer, renderTemplate } from 'astra'
```

This change was applied in `src/main/services/templateRenderer.ts` and verified by installing dependencies and running a full build (`npm install` then `npm run build`), which completed successfully.

**Recommended upstream action (Astra)**

Prefer one of the following to make the API consumable without deep imports:

- Add explicit `exports` entries in `astra/package.json` for the service subpaths, for example:

```json
"exports": {
    "./services/templateRenderer": {
        "types": "./dist/lib.d.ts",
        "import": "./dist/services/templateRenderer.js",
        "require": "./dist/services/templateRenderer.cjs.js"
    },
    "./services/*": {
        "types": "./dist/lib.d.ts",
        "import": "./dist/services/*.js",
        "require": "./dist/services/*.cjs.js"
    }
}
```

- Or, re-export the `configureTemplateRenderer` and `renderTemplate` symbols from the package root (recommended for a stable public surface): add exports in `src/lib.ts` and ensure they are included in the root `exports` mapping.

If you'd like, I can open an upstream issue and a small PR against `NikhilVijayakumar/astra` that either adds the `./services/*` exports or re-exports the symbols from the package root.
