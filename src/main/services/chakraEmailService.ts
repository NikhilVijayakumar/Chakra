// chakraEmailService.ts
// Direct AgentMail integration using AgentMailClient.inboxes.messages.send()
// Bypasses the Prana emailService adapter which uses the wrong constructor.

let _apiKey: string | null = null
let _fromInboxId: string | null = null
let _templateRenderer: ((name: string, data: Record<string, unknown>) => Promise<string>) | null = null

export const configureChakraEmailService = (
  apiKey: string,
  inboxId: string,
  templateRenderer: (name: string, data: Record<string, unknown>) => Promise<string>
): void => {
  _apiKey = apiKey
  _fromInboxId = inboxId
  _templateRenderer = templateRenderer
  console.info('[ChakraEmail] Configured with inboxId:', inboxId)
}

export const sendChakraEmail = async (opts: {
  to: string[]
  subject: string
  templateName: string
  data: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> => {
  if (!_apiKey || !_fromInboxId || !_templateRenderer) {
    const err = 'ChakraEmail service not configured'
    console.error('[ChakraEmail]', err)
    return { success: false, error: err }
  }

  try {
    const html = await _templateRenderer(opts.templateName, opts.data)

    // Dynamic import with CJS interop — AgentMailClient is a named export
    const agentmailMod = await import('agentmail') as any
    const AgentMailClient = agentmailMod.AgentMailClient ?? agentmailMod.default?.AgentMailClient

    if (typeof AgentMailClient !== 'function') {
      throw new Error(`AgentMailClient is not a constructor. Available: ${Object.keys(agentmailMod).join(', ')}`)
    }

    const client = new AgentMailClient({ apiKey: _apiKey })

    console.info('[ChakraEmail] Sending to:', opts.to[0], 'from inbox:', _fromInboxId)
    const result = await client.inboxes.messages.send(_fromInboxId, {
      to: opts.to[0],   // AgentMail expects a single string or list; pass string directly
      subject: opts.subject,
      html
    })

    console.info('[ChakraEmail] Sent successfully, id:', (result as any)?.id ?? 'unknown')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ChakraEmail] Send failed:', msg)
    return { success: false, error: msg }
  }
}
