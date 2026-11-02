# Specifications: {{change-name}}

## 1. Specification Overview

- **OpenSpec Change ID:** `{{change-id}}`
- **Purpose:** Describe the required behavior introduced or modified by this change.
- **Related proposal:** `proposal.md`
- **Related design:** `design.md`

Organize specifications by capability. Create one specification file per affected capability using the project's OpenSpec conventions.

Recommended structure:

`specs/<capability-name>/spec.md`

Each capability specification must be independently understandable and must describe normative requirements rather than implementation instructions.

---

## 2. Capability: {{capability-name}}

### Purpose

Describe the capability and the behavior it provides.

### Scope

Identify the behavior covered by this specification and any relevant boundaries or exclusions.

### Requirements

#### Requirement: {{requirement-name}}

The system SHALL {{specific, observable behavior}}.

##### Scenario: {{scenario-name}}

- **GIVEN** {{initial context or precondition}}
- **AND** {{additional context, if needed}}
- **WHEN** {{action or event occurs}}
- **AND** {{additional action, if needed}}
- **THEN** {{expected observable outcome}}
- **AND** {{additional expected outcome, if needed}}

##### Scenario: {{boundary-or-failure-scenario}}

- **GIVEN** {{boundary condition or failure context}}
- **WHEN** {{action or event occurs}}
- **THEN** {{required behavior under that condition}}

Add scenarios for relevant alternatives, boundary conditions, error cases, authorization rules, state transitions, and recovery behavior.

### Additional Requirements

Add further requirements using the same structure when needed.

#### Requirement: {{another-requirement-name}}

The system SHALL {{specific, observable behavior}}.

##### Scenario: {{scenario-name}}

- **GIVEN** {{context}}
- **WHEN** {{action or event}}
- **THEN** {{expected outcome}}

---

## 3. Cross-Capability Requirements

Use this section only when requirements genuinely apply across multiple capabilities and cannot be expressed more clearly within the individual capability specifications.

### Requirement: {{cross-capability-requirement}}

The system SHALL {{observable cross-capability behavior}}.

##### Scenario: {{scenario-name}}

- **GIVEN** {{context}}
- **WHEN** {{action or event}}
- **THEN** {{expected outcome}}

Avoid duplicating requirements across capabilities. Reference the relevant capability specification when appropriate.

---

## 4. Quality and Operational Requirements

Document measurable, externally verifiable quality or operational requirements that are in scope for this change.

Examples include performance, reliability, security, accessibility, compatibility, and resource constraints.

### Requirement: {{quality-requirement-name}}

The system SHALL {{measurable or otherwise verifiable condition}}.

##### Scenario: {{scenario-name}}

- **GIVEN** {{relevant operating conditions}}
- **WHEN** {{system behavior is exercised or measured}}
- **THEN** {{required result or threshold}}

Use actual project-defined thresholds where available. Do not invent targets or claim guarantees that have not been agreed upon.

If a quality concern is relevant but no requirement or threshold has been established, record it as an open question rather than presenting an assumption as a requirement.

---

## 5. Specification Review

- [ ] Every in-scope behavior is described by a requirement.
- [ ] Requirements use precise, unambiguous, observable language.
- [ ] Each requirement has a stable, descriptive name.
- [ ] Scenarios describe context, action, and expected outcome.
- [ ] Relevant normal, boundary, and failure behaviors are covered.
- [ ] Requirements are consistent with the proposal and do not prescribe unnecessary implementation details.
- [ ] Cross-capability behavior is specified without unnecessary duplication.
- [ ] Quality requirements use measurable criteria where applicable.
- [ ] Assumptions and unresolved questions are explicitly identified.
- [ ] The specifications provide sufficient detail for design, task breakdown, and verification.

**Status:** Draft / Ready for design and task breakdown