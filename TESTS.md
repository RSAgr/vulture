# Testing Strategy

## Overview

This document outlines the testing approach for the Vulture project. We use **Vitest** as our test framework, providing a fast, modern testing experience with excellent TypeScript support and React Testing Library for component testing.

## Test Setup

### Frameworks & Tools

- **Vitest**: Fast unit test framework with TypeScript support
- **React Testing Library**: For component testing with a focus on user behavior
- **jsdom**: DOM environment for running tests

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm test:ui

# Run tests once (CI mode)
npm test -- --run

# Generate coverage report
npm run test:coverage
```

## Test Structure

Tests are colocated with their source files using the `.test.ts` or `.test.tsx` naming convention:

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
├── components/
│   └── common/
│       ├── Navbar.tsx
│       └── Navbar.test.tsx
└── hooks/
    └── useDebounce.ts
    └── useDebounce.test.ts
```

## Test Coverage Goals

- **Utilities & Helpers**: 90%+ coverage
- **Components**: 80%+ coverage
- **Hooks**: 85%+ coverage
- **Services**: 75%+ coverage

## What We Test

### Unit Tests
- Utility functions (cn, date formatting, validation, etc.)
- Custom hooks behavior
- Service methods logic

### Component Tests
- Component renders correctly
- Props are applied properly
- User interactions (clicks, input changes)
- Conditional rendering
- Accessibility attributes

## Current Test Coverage

### Tested Modules

1. **src/lib/utils.ts** - `cn()` utility function
   - ClassNames merging
   - Tailwind conflict resolution
   - Conditional class handling

2. **src/components/common/Navbar.tsx**
   - Component rendering
   - Navigation links
   - CTA button presence
   - Sticky positioning

3. **src/components/common/Container.tsx**
   - Children rendering
   - Container styling
   - Custom className application

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

The CI workflow:
1. Installs dependencies
2. Runs linter (ESLint)
3. Runs test suite
4. Builds the application
5. Generates and uploads coverage reports

## Future Testing Plans

- [ ] E2E tests for critical user flows (Playwright)
- [ ] Integration tests for API routes
- [ ] Performance tests for Lighthouse metrics
- [ ] Visual regression tests
- [ ] Load testing for audit endpoints

## Adding New Tests

When creating new features:

1. Write unit tests for utility functions
2. Write component tests for UI elements
3. Test user interactions, not implementation
4. Aim for meaningful coverage, not 100% coverage
5. Run tests locally before pushing

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

## Debugging Tests

- Run `npm test:ui` to see a visual test runner
- Use `console.log()` and `screen.debug()` for debugging
- Check coverage with `npm run test:coverage`
- Use `it.only()` to run a single test
- Use `it.skip()` to temporarily skip a test
