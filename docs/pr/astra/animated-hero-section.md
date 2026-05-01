# Astra PR: Animated HeroSection Component

## PR Title
`feat: add entrance animations to HeroSection component`

## 1. Overview
Enhances the existing HeroSection component with configurable entrance animations. The animations play once on mount, suitable for section-by-section navigation where each section animates when it becomes visible.

Astra components are stateless (data via props), so all animation state and configuration is passed via props. Chakra will control when to trigger the animation by managing the component's mount state.

## 2. Key Design Decisions
| Decision | Resolution |
|----------|-------------|
| Animation Library | framer-motion (already in Astra dependencies) |
| Animation Type | Entrance animations (play once on mount) |
| Animation Control | All via props - stateless component |
| Default Behavior | Animation enabled by default |
| Stagger Support | Support stagger animation for child elements |

## 3. Changes to Astra

### 3.1 Modified Files
| File Path | Changes |
|-----------|---------|
| `src/common/components/templates/HeroSection.tsx` | Add framer-motion animations |
| `src/common/components/templates/HeroSection.test.tsx` | Update tests for animation |

### 3.2 New Props Added
```typescript
export interface HeroSectionProps {
    // Existing props
    headline: string;
    description?: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    children?: ReactNode;

    // New animation props
    enableAnimation?: boolean;           // Default: true
    animationVariant?: AnimationVariant; // Default: 'fade-up'
    animationDuration?: number;         // Default: 600 (ms)
    animationDelay?: number;             // Default: 0 (ms)
    animationStagger?: number;          // Default: 100 (ms) - for stagger-fade
}
```

### 3.3 Animation Variants
| Variant | Description | Use Case |
|---------|-------------|----------|
| `fade-up` | Fade in + translateY from 20px to 0 | Default, general purpose |
| `fade-in` | Simple opacity fade (0 → 1) | Subtle entrance |
| `slide-left` | TranslateX from -30px to 0 + fade | Left-to-right flow |
| `slide-right` | TranslateX from 30px to 0 + fade | Right-to-left flow |
| `scale-up` | Scale from 0.9 to 1 + fade | Emphasis/spotlight |
| `stagger-fade` | Children fade in sequentially | Lists, multiple items |
| `typewriter` | Characters appear one by one | Headlines, call-to-action |

## 4. Implementation Specification

### 4.1 HeroSection Component Update
```typescript
import { FC, ReactNode, useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { spacing } from '../../../theme/tokens/spacing';
import { colors } from '../../../theme/tokens/colors';

export type AnimationVariant =
  | 'fade-up'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'stagger-fade'
  | 'typewriter';

export interface HeroSectionProps {
  headline: string;
  description?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  children?: ReactNode;
  enableAnimation?: boolean;
  animationVariant?: AnimationVariant;
  animationDuration?: number;
  animationDelay?: number;
  animationStagger?: number;
}

const animationConfigs = {
  'fade-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  'fade-in': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'slide-left': {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
  },
  'slide-right': {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
  },
  'scale-up': {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
  },
};

export const HeroSection: FC<HeroSectionProps> = ({
  headline,
  description,
  primaryActionLabel,
  onPrimaryAction,
  children,
  enableAnimation = true,
  animationVariant = 'fade-up',
  animationDuration = 600,
  animationDelay = 0,
  animationStagger = 100,
}) => {
  const config = animationConfigs[animationVariant];

  const shouldAnimate = enableAnimation && config;

  const transition = {
    duration: animationDuration / 1000,
    ease: 'easeOut',
    delay: animationDelay / 1000,
  };

  // Typewriter effect uses custom implementation
  const isTypewriter = animationVariant === 'typewriter';
  const isStaggerFade = animationVariant === 'stagger-fade';

  return (
    <Box
      sx={{
        py: spacing.xxl,
        px: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: spacing.lg,
        maxWidth: '800px',
      }}
    >
      {/* Headline */}
      {shouldAnimate && !isTypewriter ? (
        <motion.div
          initial={config.initial}
          animate={config.animate}
          transition={transition}
        >
          <Typography
            variant="h1"
            fontWeight={600}
            color="text.primary"
            sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            {headline}
          </Typography>
        </motion.div>
      ) : isTypewriter ? (
        <TypewriterHeadline
          text={headline}
          duration={animationDuration}
          delay={animationDelay}
        />
      ) : (
        <Typography
          variant="h1"
          fontWeight={600}
          color="text.primary"
          sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          {headline}
        </Typography>
      )}

      {/* Description */}
      {description && (
        shouldAnimate && !isTypewriter ? (
          <motion.div
            initial={config.initial}
            animate={config.animate}
            transition={{ ...transition, delay: (animationDelay + animationDuration) / 1000 }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: '600px', lineHeight: 1.6 }}
            >
              {description}
            </Typography>
          </motion.div>
        ) : (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '600px', lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        )
      )}

      {/* Primary Action */}
      {primaryActionLabel && (
        shouldAnimate ? (
          <motion.div
            initial={config.initial}
            animate={config.animate}
            transition={{ ...transition, delay: (animationDelay + animationDuration * 1.5) / 1000 }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={onPrimaryAction}
              disableElevation
              sx={{
                backgroundColor: colors.primary,
                color: '#fff',
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: colors.primaryHover,
                },
              }}
            >
              {primaryActionLabel}
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onPrimaryAction}
            disableElevation
            sx={{
              backgroundColor: colors.primary,
              color: '#fff',
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: colors.primaryHover,
              },
            }}
          >
            {primaryActionLabel}
          </Button>
        )
      )}

      {/* Children */}
      {children && (
        shouldAnimate ? (
          <motion.div
            initial={config.initial}
            animate={config.animate}
            transition={{ ...transition, delay: (animationDelay + animationDuration * 2) / 1000 }}
            style={{ mt: spacing.xs, width: '100%' }}
          >
            {children}
          </motion.div>
        ) : (
          <Box sx={{ mt: spacing.xs, width: '100%' }}>{children}</Box>
        )
      )}
    </Box>
  );
};
```

### 4.2 Typewriter Component (Helper)
```typescript
// Internal helper - not exported separately
const TypewriterHeadline: FC<{ text: string; duration: number; delay: number }> = ({
  text,
  duration,
  delay,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const charCount = text.length;
  const charDuration = duration / charCount;

  useEffect(() => {
    let currentIndex = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        currentIndex++;
        setDisplayedText(text.slice(0, currentIndex));
        if (currentIndex >= charCount) {
          clearInterval(interval);
        }
      }, charDuration);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, charCount, charDuration, delay]);

  return (
    <Typography
      variant="h1"
      fontWeight={600}
      color="text.primary"
      sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </Typography>
  );
};
```

## 5. Integration with Chakra

### 5.1 Chakra Usage Example
```typescript
// Chakra: Using animated HeroSection in dashboard
import { HeroSection } from 'astra';

// Basic usage with default animation (fade-up)
<HeroSection
  headline="Welcome to Chakra"
  description="Your encrypted virtual drive"
/>

// Custom animation
<HeroSection
  headline="Analytics Dashboard"
  description="View your key metrics"
  enableAnimation={true}
  animationVariant="fade-up"
  animationDuration={800}
  animationDelay={200}
/>

// Typewriter for hero headlines
<HeroSection
  headline="Secure Your Data"
  animationVariant="typewriter"
  animationDuration={2000}
  animationDelay={500}
/>

// Disable animation for static content
<HeroSection
  headline="Static Section"
  enableAnimation={false}
/>
```

### 5.2 Chakra Section Navigation Pattern
```typescript
// Chakra: Section-by-section animation pattern
const Dashboard = () => {
  const [currentSection, setCurrentSection] = useState(0);

  return (
    <Box>
      <HeroSection
        headline="Welcome"
        animationVariant="fade-up"
        enableAnimation={currentSection === 0}
        animationDelay={0}
      />
      <HeroSection
        headline="Your Files"
        animationVariant="slide-left"
        enableAnimation={currentSection === 1}
        animationDelay={0}
      />
      <HeroSection
        headline="Analytics"
        animationVariant="stagger-fade"
        enableAnimation={currentSection === 2}
        animationDelay={0}
      />
    </Box>
  );
};
```

## 6. Testing Steps

### 6.1 Unit Tests
| Test | Description |
|------|-------------|
| Renders without animation when enableAnimation=false | Verify component renders static |
| Applies fade-up animation correctly | Verify opacity and transform |
| Applies slide-left animation correctly | Verify x translation |
| Applies scale-up animation correctly | Verify scale transform |
| animationDuration controls timing | Verify duration prop is applied |
| animationDelay controls start time | Verify delay prop is applied |

### 6.2 Visual Tests
| Test | Description |
|------|-------------|
| Typewriter reveals characters sequentially | Visual verification |
| Stagger-fade animates children in sequence | Visual verification |
| Animation plays only once on mount | Verify no repeat |

## 7. Dependencies
No new dependencies required - framer-motion already in Astra.

## 8. Checklist
- [ ] Update `HeroSection.tsx` with animation props
- [ ] Implement all 7 animation variants
- [ ] Add TypewriterHeadline helper component
- [ ] Update exports in `src/common/components/templates/index.ts`
- [ ] Update `HeroSection.test.tsx` for animation tests
- [ ] Test each animation variant
- [ ] Document usage in Chakra