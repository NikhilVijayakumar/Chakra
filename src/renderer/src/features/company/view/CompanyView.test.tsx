// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CompanyData } from '../repo/CompanyRepo'
import { CompanyView } from './CompanyView'

const makeCompany = (): CompanyData => ({
  companyId: 'acme-company',
  core: {
    identity: {
      name: 'Acme Company',
      type: 'Studio',
      foundation: 'People-first execution',
      philosophy: ['clarity', 'focus']
    },
    vision: 'Ship reliable systems',
    context: {
      stage: 'ACTIVE',
      constraints: [],
      operational_environment: []
    },
    mission_alignment: {
      primary_mission: 'Ship reliable systems',
      secondary_mission: 'Support operators',
      ai_role: ['assistant']
    },
    core_values: ['clarity', 'accountability'],
    ai_governance_model: {
      role_definition: {
        ai: 'AI assistant',
        human: 'Human owner'
      },
      value_boundaries: {
        ai_can_assist: ['summarize'],
        human_only_control: ['approve']
      },
      allowed_ai_functions: [],
      restricted_ai_functions: [],
      persona_governance: []
    },
    global_non_negotiables: ['do not invent data'],
    risk_framework: {
      required_in_every_decision: [],
      risk_response_principles: []
    },
    auditability: {
      requirements: [],
      purpose: []
    },
    explicit_exclusions: [],
    long_term_intent: {
      goal: 'Ship',
      direction: []
    },
    website: ['https://example.com']
  }
})

describe('CompanyView', () => {
  it('renders loading, error, and empty states', () => {
    const { rerender } = render(
      <CompanyView
        company={null}
        isLoading={true}
        error={null}
        isDirty={false}
        isSaving={false}
        onUpdateCore={() => {}}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('progressbar')).toBeTruthy()

    rerender(
      <CompanyView
        company={null}
        isLoading={false}
        error={'Unable to load company'}
        isDirty={false}
        isSaving={false}
        onUpdateCore={() => {}}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('Unable to load company')).toBeTruthy()

    rerender(
      <CompanyView
        company={null}
        isLoading={false}
        error={null}
        isDirty={false}
        isSaving={false}
        onUpdateCore={() => {}}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('No company data found')).toBeTruthy()
  })

  it('renders edit mode and save success feedback', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <CompanyView
        company={makeCompany()}
        isLoading={false}
        error={null}
        isDirty={true}
        isSaving={false}
        onUpdateCore={() => {}}
        onSave={onSave}
      />
    )

    expect(screen.getByRole('heading', { name: 'Company' })).toBeTruthy()
    expect(screen.getByText('Acme Company')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save to Vault' })).toBeTruthy()
    expect(screen.getByText('You have unsaved changes')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save to Vault' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Company saved to vault')).toBeTruthy()
  })
})
