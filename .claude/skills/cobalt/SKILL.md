```markdown
# cobalt Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides guidance on contributing to the `cobalt` TypeScript codebase. It documents the project's coding conventions, file organization, and testing patterns, ensuring consistency and maintainability. While no specific frameworks or automated workflows are detected, this guide will help you follow the established patterns for file naming, imports/exports, commit messages, and testing.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `dataFetcher.ts`

### Import Style
- Use **relative imports** for referencing modules.
  - Example:
    ```typescript
    import { fetchData } from './dataFetcher';
    ```

### Export Style
- Both **named** and **default exports** are used.
  - Named export example:
    ```typescript
    export function calculateSum(a: number, b: number): number {
      return a + b;
    }
    ```
  - Default export example:
    ```typescript
    export default class UserManager { ... }
    ```

### Commit Messages
- **Freeform** style, with no enforced prefixes.
- Average commit message length: ~59 characters.
- Example:
  ```
  Fix issue with user authentication flow
  ```

## Workflows

### Creating a New Module
**Trigger:** When adding new functionality.
**Command:** `/create-module`

1. Create a new file using camelCase naming (e.g., `newFeature.ts`).
2. Implement the module logic.
3. Use relative imports for dependencies.
4. Export your module (named or default as appropriate).
5. Add corresponding test file (e.g., `newFeature.test.ts`).
6. Commit changes with a clear, descriptive message.

### Modifying Existing Code
**Trigger:** When updating or refactoring code.
**Command:** `/modify-code`

1. Locate the relevant file using camelCase naming.
2. Make necessary changes, maintaining code style.
3. Update or add tests if needed.
4. Commit with a concise, descriptive message.

### Writing Tests
**Trigger:** When adding or updating features.
**Command:** `/write-test`

1. Create or update a test file matching `*.test.*` pattern (e.g., `feature.test.ts`).
2. Write tests using the project's preferred (but unspecified) testing framework.
3. Ensure tests cover new or changed functionality.
4. Run tests to verify correctness.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `userProfile.test.ts`).
- The specific testing framework is **unknown**; refer to existing test files for structure.
- Place tests alongside or near the modules they test.
- Example test file:
  ```typescript
  import { calculateSum } from './calculateSum';

  test('adds two numbers', () => {
    expect(calculateSum(2, 3)).toBe(5);
  });
  ```

## Commands
| Command         | Purpose                                   |
|-----------------|-------------------------------------------|
| /create-module  | Scaffold a new module with tests          |
| /modify-code    | Update or refactor existing code          |
| /write-test     | Add or update a test file                 |
```
