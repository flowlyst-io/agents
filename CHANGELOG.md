# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2025-11-04

### Fixed
- Server-side file upload configuration in ChatKit session creation to enable actual file uploads

## [0.2.1] - 2025-11-04

### Added
- File attachment support in ChatKit composer for all agents to enable file processing workflows

## [0.2.0] - 2025-11-04

### Added
- Multi-agent dashboard for client-specific agent navigation at `/embed/dashboard/[clientSlug]` (FA-4)
- AgentCard component for displaying agents with icons and click-to-chat functionality (FA-4)
- DashboardHeader component with optional back navigation for agent views (FA-4)
- Dynamic icon assignment based on agent name (support, sales, tech, HR icons) (FA-4)
- Empty state handling for clients with no configured agents (FA-4)
- Hard-coded workflow ID configuration system for POC client deployments (FA-4)

### Known Issues
- Multi-agent dashboard navigation uses full page reloads (workaround for FA-5)
- Page flashing occurs when switching between agents due to forced page reload (FA-5)

## [0.1.1] - 2025-10-14

### Changed
- Improved embed page layout to use full viewport height for better iframe integration (FA-3)
- Refactored ChatKitPanel to manage theme state internally, simplifying component usage (FA-3)

### Removed
- Removed MVP_PRD.md documentation file (FA-3)

## [0.1.0] - 2025-10-13

### Added
- Multi-agent system with database-driven workflow routing enabling multiple ChatKit agents from single codebase
- Agent management admin interface at `/admin` with CRUD operations for agents
- Database migrations for CI/CD pipeline with automatic migration on Vercel deployment
- Codery development workflow configuration with role-based development modes and JIRA integration
- Auto-generated random slugs for agent URLs using crypto.randomBytes for non-human-readable identifiers
- Engineering Reference Guide documenting architecture, components, and development patterns
- Public embed routes at `/embed/[slug]` for iframe integration into external websites

### Changed
- Replaced default template index page with Flowlyst Agents branding page
- Updated Engineering Reference Guide to document multi-agent architecture patterns
- Updated database migration workflow documentation for production deployments

### Fixed
- Next.js 15 dynamic route params compatibility by adding async/await for params access

---

**Project Origin**: Based on OpenAI ChatKit Starter App template (October 2025)
