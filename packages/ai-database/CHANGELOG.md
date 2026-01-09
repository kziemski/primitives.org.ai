# ai-database

## 2.1.0

### Minor Changes

- **Natural Language Query Execution**: Wire up tagged template literal handler (`db.Lead\`query\``) and `db.ask()` method for natural language database queries. Supports AI-powered query generation via `setNLQueryGenerator()` with fallback to keyword search.

- **Schema Input Validation**: Comprehensive validation for entity names, field names, field types, and operator syntax. Prevents SQL injection, XSS, and provides helpful error messages. Throws `SchemaValidationError` with error codes and paths for programmatic handling.

### Patch Changes

- Fixed TypeScript build error in parse.ts operator validation

## 2.0.3

### Patch Changes

- Updated dependencies
  - rpc.do@0.2.0
  - ai-functions@2.0.3

## 2.0.2

### Patch Changes

- Updated dependencies
  - ai-functions@2.0.2

## 2.0.1

### Patch Changes

- fixed dependencies
- Updated dependencies
  - ai-functions@2.0.1
