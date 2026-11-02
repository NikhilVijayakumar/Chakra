# Common Components Library

Reusable, stateless UI components shared across all DHI features.

## Directory Structure

```
src/renderer/src/common/components/
├── index.ts                          # Main export barrel
├── common-ui/                        # Generic UI components
│   ├── CustomButton.tsx
│   ├── CustomCard.tsx
│   └── ...
├── feature-patterns/                 # Reusable feature UI patterns
│   ├── FeatureSummary.tsx
│   ├── FeatureCard.tsx
│   └── ...
├── layout/                           # Layout components
│   ├── PageHeader.tsx
│   └── PageContent.tsx
└── __tests__/                        # Component tests (Vitest)
    ├── CustomButton.test.tsx
    └── ...
```

## Component Guidelines

### 1. **Stateless (No Business State)**

❌ **DO NOT:**

```tsx
// BAD: Contains business state
export const UserList = () => {
  const [users, setUsers] = useState([]) // ← BUSINESS STATE (fetch data in ViewModel)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers().then(setUsers) // ← BUSINESS LOGIC (belongs in ViewModel)
  }, [])

  return <div>{/* ... */}</div>
}
```

✅ **DO:**

```tsx
// GOOD: Pure presentation, all state from props
interface UserListProps {
  users: User[]
  isLoading?: boolean
  onUserClick: (userId: string) => void
}

export const UserList = ({ users, isLoading = false, onUserClick }: UserListProps) => {
  return (
    <div>
      {isLoading && <CircularProgress />}
      {users.map((user) => (
        <UserCard key={user.id} user={user} onClick={() => onUserClick(user.id)} />
      ))}
    </div>
  )
}
```

### 2. **Generic & Reusable**

✅ Generic components work in ANY context:

```tsx
// GOOD: Generic card pattern
export const Card = ({ title, children, action }: CardProps) => (
  <Paper>
    <Box>
      <Typography variant="h5">{title}</Typography>
      {action && <Box>{action}</Box>}
    </Box>
    <CardContent>{children}</CardContent>
  </Paper>
)

// Usage in ANY feature
;<Card title="Daily Brief" action={<RefreshButton />}>
  <DailyBriefContent />
</Card>
```

❌ Feature-specific components DON'T belong here:

```tsx
// BAD: This belongs in features/daily-brief/presentation/components/
export const DailyBriefSummary = () => {
  /* ... */
}
```

### 3. **Well-Typed (TypeScript)**

✅ **DO:**

```tsx
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outlined'
  disabled?: boolean
  onClick: () => void
}

export const Button = ({ label, variant = 'primary', disabled, onClick }: ButtonProps) => {
  // ...
}
```

❌ **DON'T:**

```tsx
// Avoid 'any' type
export const Button = ({ label, variant, disabled, onClick }: any) => {
  /* ... */
}
```

### 4. **Fully Documented**

Every exported component must have JSDoc:

````tsx
/**
 * StatusBadge
 *
 * Displays a status indicator with customizable color and label.
 *
 * @example
 * ```tsx
 * <StatusBadge status="success" label="Active" />
 * <StatusBadge status="warning" label="Pending" />
 * ```
 *
 * @param props - StatusBadgeProps
 * @returns JSX.Element
 */
export const StatusBadge = (props: StatusBadgeProps) => {
  /* ... */
}
````

## Integration Pattern: MVVM Clean Architecture

### Container → ViewModel → Component

```
Feature Data Structure:
features/daily-brief/
├── data/
│   └── DailyBriefRepo.ts
├── domain/
│   └── daily-brief.types.ts
└── presentation/
    ├── components/
    │   ├── DailyBriefCard.tsx     ← Stateless (uses common patterns)
    │   └── BriefSummary.tsx       ← Stateless
    ├── containers/
    │   └── DailyBriefContainer.tsx ← Orchestrator
    └── viewmodels/
        └── useDailyBriefViewModel.ts ← Business Logic
```

### Execution Flow

```
1. Route → DailyBriefContainer (stateful orchestrator)
2. Container calls useDailyBriefViewModel (fetch data, manage state)
3. ViewModel returns { state, actions }
4. Container passes state as props to Components
5. Components are 100% stateless (this directory)
```

### Example Code

**ViewModel (features/daily-brief/presentation/viewmodels/useDailyBriefViewModel.ts):**

```tsx
export const useDailyBriefViewModel = () => {
  const [briefData, setBriefData] = useState<DailyBriefsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const data = await DailyBriefRepo.fetch()
    setBriefData(data)
    setLoading(false)
  }

  return {
    state: { briefData, loading },
    reload: loadData
  }
}
```

**Container (features/daily-brief/presentation/containers/DailyBriefContainer.tsx):**

```tsx
export const DailyBriefContainer = () => {
  const { state, reload } = useDailyBriefViewModel()

  return (
    <AppStateHandler state={state} onRetry={reload}>
      {state.briefData && (
        <>
          <DailyBriefHeader data={state.briefData.header} />
          <DailyBriefCard data={state.briefData.card} />
          <DailyBriefFooter onRefresh={reload} />
        </>
      )}
    </AppStateHandler>
  )
}
```

**Component (common/components/feature-patterns/DailyBriefCard.tsx):**

```tsx
interface DailyBriefCardProps {
  data: DailyBriefPayload
}

export const DailyBriefCard = ({ data }: DailyBriefCardProps) => (
  <Card title="Today's Brief">
    <summary>{data.summary}</summary>
    <actions>
      {data.actions.map((a) => (
        <Action key={a.id} action={a} />
      ))}
    </actions>
  </Card>
)
```

## When to Create a Component Here

✅ **Create a component in `common/components/` when:**

- Multiple features use the same UI pattern
- It's purely presentational (no business logic)
- It accepts all data as props (fully composable)
- It could be used in a different app with minimal changes
- It's well-typed and documented

❌ **Create a component in `features/[name]/presentation/components/` when:**

- It's specific to one feature
- It needs feature-specific business logic
- It imports from the same feature's data/domain layers
- It's part of a feature's internal view hierarchy

## Testing Components

All components must have unit tests in `__tests__/`:

```typescript
// common/components/__tests__/DailyBriefCard.test.tsx
import { render } from '@testing-library/react';
import { DailyBriefCard } from '../feature-patterns/DailyBriefCard';

describe('DailyBriefCard', () => {
  it('renders brief summary', () => {
    const { getByText } = render(
      <DailyBriefCard data={mockData} />
    );
    expect(getByText(mockData.summary)).toBeDefined();
  });
});
```

## Referencing Astra Components

Re-export commonly used Astra components for convenience:

```typescript
// common/components/index.ts
export { Card, DataTable, FormLayout } from 'astra/components/ui'
export { useLanguage } from 'astra'
```

Then features can import:

```typescript
import { Card, DataTable } from '@renderer/common/components'
```

## Best Practices Checklist

- [ ] Component receives all data via props (no Redux/Context for presentation)
- [ ] Props interface is exported and well-documented
- [ ] Component has JSDoc comment
- [ ] No `useState` for business logic (only UI state like accordion open/close)
- [ ] No direct API calls (use repositories/ViewModels)
- [ ] Fully typed with TypeScript (no `any`)
- [ ] Uses MUI components for consistent theming
- [ ] Uses `useLanguage()` for all text (no hardcoded strings)
- [ ] Uses spacing tokens from theme (no hardcoded `px` values)
- [ ] Has unit tests with >80% coverage
- [ ] Is responsive (mobile-first layout)
- [ ] Is accessible (ARIA labels, semantic HTML)

---

**Questions?** See [docs/core/MVVM_Clean_Architecture.md](../../../../docs/core/MVVM_Clean_Architecture.md)
