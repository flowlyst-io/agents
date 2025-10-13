# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
