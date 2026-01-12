# AI Primitives Roadmap

This document outlines the development roadmap for the AI Primitives monorepo (`primitives.org.ai`). Our mission is to provide a comprehensive, type-safe foundation for building intelligent applications with AI.

## Current Status (v2.1.x)

### Production-Ready

These packages are stable, well-tested, and recommended for production use:

| Package | Version | Description |
|---------|---------|-------------|
| `ai-functions` | 2.1.2 | Core AI primitives: `AI()`, `ai()`, `ai.do()`, `ai.is()`, `ai.generate()`, `ai.list()`, etc. |
| `ai-database` | 2.1.2 | AI-powered database interface with mdxld conventions |
| `ai-workflows` | 2.1.2 | Event-driven workflows with `Workflow()`, `on()`, `every()`, `send()` |
| `ai-providers` | 2.1.1 | Unified provider registry with Cloudflare AI Gateway support |

### Stable

These packages are feature-complete for their current scope but may see API refinements:

| Package | Version | Description |
|---------|---------|-------------|
| `digital-tasks` | 2.1.1 | Task management with lifecycle, queues, dependencies, and markdown parsing (122 tests) |
| `digital-tools` | 2.1.1 | Tool interface, ontology (12 categories), registry, and MCP compatibility |

### Early Development

These packages have foundational implementations but are not yet feature-complete:

| Package | Version | Description |
|---------|---------|-------------|
| `digital-workers` | 2.1.1 | Common abstract interface over AI agents and humans |
| `autonomous-agents` | 2.1.1 | Primitives for building autonomous AI agents |
| `human-in-the-loop` | 2.1.1 | Human oversight and intervention in AI workflows |

### Planned

These packages have initial scaffolding but require significant implementation work:

| Package | Version | Description |
|---------|---------|-------------|
| `business-as-code` | 2.1.1 | Express business logic and processes as code |
| `services-as-software` | 2.1.1 | AI-powered services that operate as software |

---

## Near-Term: Q1 2026

### Documentation Overhaul (StoryBrand READMEs)

Restructure all package documentation using the StoryBrand framework:

- **Hero**: Developers building AI applications
- **Problem**: AI code complexity, inconsistent APIs, maintenance nightmares
- **Guide**: AI Primitives with empathy + authority
- **Plan**: Install -> Import -> Ship
- **Success**: Clean, type-safe, production-ready AI apps

**Deliverables:**
- [ ] Unified README template across all packages
- [ ] Clear "Getting Started" sections with minimal code examples
- [ ] API reference documentation for production-ready packages
- [ ] Migration guides from common patterns (raw SDK calls, etc.)

### Type Safety Improvements

- [ ] Stricter TypeScript configuration across all packages
- [ ] Improved generic type inference for `ai.do()` and `ai.generate()`
- [ ] Better error types with discriminated unions
- [ ] Export all public types explicitly

### Timer Cleanup Fixes

- [ ] Audit and fix timer/interval cleanup in `ai-workflows`
- [ ] Ensure proper resource disposal in long-running workflows
- [ ] Add lifecycle hooks for cleanup operations

---

## Medium-Term: Q2 2026

### digital-workers Implementation

Complete the unified worker abstraction layer:

- [ ] `Worker` base interface with common capabilities
- [ ] `Role()` - Define worker roles and responsibilities
- [ ] `Team()` - Compose workers into collaborative teams
- [ ] `Goals()` - Set and track worker objectives
- [ ] Action primitives: `approve()`, `ask()`, `do()`, `decide()`, `generate()`, `is()`, `notify()`
- [ ] Metrics: `kpis()`, `okrs()`

### human-in-the-loop Runtime

Build the runtime for human oversight:

- [ ] `Human()` - Human worker interface
- [ ] Approval workflows with configurable escalation
- [ ] Review queues for AI-generated outputs
- [ ] Audit trails for human decisions
- [ ] Integration with notification systems (email, Slack, etc.)

### State Machine Abstraction

Extend `ai-workflows` with formal state machine support:

- [ ] `StateMachine()` - Declarative state machine definitions
- [ ] State transitions with guards and actions
- [ ] Hierarchical and parallel states
- [ ] Persistence and replay capabilities
- [ ] Visual state diagram generation

---

## Long-Term: H2 2026

### business-as-code Runtime

Full implementation of business logic primitives:

- [ ] `Business()` - Top-level business entity
- [ ] `Vision()`, `Goals()` - Strategic planning primitives
- [ ] `Product()`, `Service()` - Offering definitions
- [ ] `Process()`, `Workflow()` - Operational flows
- [ ] Financial primitives: `financials()`, `$`
- [ ] Metrics: `kpis()`, `okrs()`
- [ ] Validation and compliance hooks

### services-as-software Hosting Layer

Build the hosting infrastructure for AI services:

- [ ] `Service()` - Service definition and lifecycle
- [ ] Request handling: `ask()`, `do()`, `order()`
- [ ] Response generation: `deliver()`, `generate()`, `quote()`
- [ ] Scheduling: `every()`, `on()`, `schedule()`, `queue()`
- [ ] Subscription management: `subscribe()`, `entitlements()`
- [ ] Notification system: `notify()`, `is()`
- [ ] Metrics and monitoring: `kpis()`, `okrs()`

### v3.0 Release

Major version with breaking changes cleanup:

- [ ] Remove deprecated APIs from v2.x
- [ ] Consolidate overlapping functionality between packages
- [ ] Stabilize all package APIs
- [ ] Comprehensive migration guide from v2.x to v3.0
- [ ] Full documentation site with interactive examples
- [ ] Performance benchmarks and optimization

---

## How to Contribute

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install`
3. **Build all packages**: `pnpm build`
4. **Run tests**: `pnpm test`

### Ways to Contribute

- **Bug Reports**: Open an issue with reproduction steps
- **Feature Requests**: Propose new features via GitHub Discussions
- **Documentation**: Improve READMEs, add examples, fix typos
- **Code**: Pick up an issue labeled `good first issue` or `help wanted`

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and test
pnpm test

# Create a changeset for versioning
pnpm changeset

# Submit a pull request
```

### Code Standards

- All code must be written in TypeScript
- Maintain 80%+ test coverage for new code
- Follow the existing code style (enforced by ESLint)
- Document public APIs with JSDoc comments

### Package-Specific Contributions

| Area | Package(s) | Skill Level |
|------|------------|-------------|
| AI Functions | `ai-functions`, `ai-core` | Intermediate |
| Database | `ai-database` | Intermediate |
| Workflows | `ai-workflows` | Advanced |
| Workers | `digital-workers`, `autonomous-agents`, `human-in-the-loop` | Advanced |
| Business Logic | `business-as-code`, `services-as-software` | Expert |

---

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

- **Patch** (2.1.x): Bug fixes, documentation updates
- **Minor** (2.x.0): New features, non-breaking changes
- **Major** (x.0.0): Breaking changes, API redesigns

---

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Discord**: [Coming soon]

---

*Last updated: January 2026*
