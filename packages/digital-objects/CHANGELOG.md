# Changelog

## [1.0.0] - 2026-01-15

### Added
- Core model: Nouns, Verbs, Things, Actions
- MemoryProvider for in-memory storage
- NS Durable Object with SQLite persistence
- NSClient HTTP client
- R2 persistence (snapshots, WAL, JSONL)
- ai-database adapter (DBProvider interface)
- Schema validation with opt-in validation
- Batch operations (createMany, updateMany, deleteMany, performMany)
- Graph traversal (related, edges)
- Linguistic derivation (pluralization, verb conjugation)
- Query limits (DEFAULT_LIMIT=100, MAX_LIMIT=1000)
- Custom error classes (NotFoundError, ValidationError, ConflictError)

### Security
- SQL injection prevention with orderBy validation
- GDPR compliance with deleteAction support

### Documentation
- Comprehensive MDX documentation in content/digital-objects/
- README with quick start and examples
