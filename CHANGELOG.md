# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.2] - 2025-12-18

### Security
- Fixed critical RCE vulnerability in React Server Components (CVE-2025-55182, CVE-2025-66478) by upgrading React and Next.js packages to patched versions

## [0.4.1] - 2025-12-01

### Fixed
- ChatKit input box partially hidden when navigating to agent from dashboard due to nested h-screen CSS conflict (FA-13)

## [0.4.0] - 2025-11-12

### Added
- Database-driven dashboard management system with admin UI for creating and managing client dashboards (FA-7)
- Dashboards table with many-to-many relationship to agents via dashboard_agents junction table (FA-7)
- Dashboard CRUD API endpoints at `/api/dashboards` with full create, read, update, delete operations (FA-7)
- Dashboard-agent association management API at `/api/dashboards/[id]/agents` for linking/unlinking agents (FA-7)
- Admin UI components: DashboardModal for create/edit operations and DashboardAgentPicker for multi-select agent assignment (FA-7)
- Unified embed routes at `/embed/dashboard/[slug]` with smart routing (database-first, legacy CLIENT_WORKFLOWS fallback) (FA-7)
- Random hex slug generation for dashboards matching agent security pattern (prevents enumeration attacks) (FA-7)
- Show/Hide embed toggle with expandable iframe code preview and copy functionality (FA-7)
- "Go to Dashboard" navigation link for quick access to live dashboard view (FA-7)
- Badge component from shadcn/ui for visual status indicators (FA-7)

### Changed
- Consolidated dashboard routing from dual systems (`/embed/dashboard/db/[slug]` and `/embed/dashboard/[clientSlug]`) to single unified route (FA-7)
- Removed `/db/` prefix from dashboard embed URLs for cleaner client-facing URLs (FA-7)
- Updated admin UI with three-tab interface (Agents/Tenants/Dashboards) for comprehensive system management (FA-7)
- Enhanced dashboard modal and agent picker UX with improved spacing hierarchy and clearer labels (FA-7)

### Fixed
- Dashboard embed route backwards compatibility maintained for legacy CLIENT_WORKFLOWS configurations (FA-7)
- Dashboard agent association API (POST/DELETE `/api/dashboards/[id]/agents`) URL construction error in Vercel deployment causing "Failed to parse URL" errors (FA-7)

## [0.3.0] - 2025-01-11

### Added
- Tenant management system for organizing agents by client (FA-8)
- Tenants table with unique name constraint and nullable tenantId foreign key on agents (FA-8)
- Admin UI with two-tab interface (Agents/Tenants) for managing agents and tenants (FA-8)
- Tenant CRUD operations: create, rename, and delete with three deletion options (FA-8)
- Smart tenant deletion with options to make agents general purpose, reassign to another tenant, or delete agents (FA-8)
- Agent-tenant assignment capabilities: assign on create, assign on edit, and reassign between tenants (FA-8)
- Tenant filtering in agents list with General Purpose category for unassigned agents (FA-8)
- Inline tenant creation directly in agent modal via Command+Popover combobox (FA-8)
- shadcn/ui component library infrastructure with Dialog, Tabs, Command, Popover, AlertDialog, Select, Button, Input, Label, and RadioGroup (FA-8)
- Click-to-filter navigation from tenant list to filtered agents view (FA-8)
- Visual tenant badges with color coding in agents table (FA-8)

### Changed
- Migrated admin UI components from custom implementations to shadcn/ui for better accessibility and maintainability (FA-8)
- Restored original dark theme as default (#0a0a0a background) to match develop branch styling (FA-8)
- Updated Engineering Reference Guide with shadcn/ui component library documentation and usage guidelines (FA-8)

### Fixed
- Agent modal combobox now correctly distinguishes between selecting existing tenants vs creating new ones, preventing duplicate key errors (FA-8)
- Dark theme color contrast issues in admin dashboard for improved tab visibility (FA-8)

## [0.2.4] - 2025-11-10

### Added
- Alshaya client "AI Agents" dashboard at `/embed/dashboard/alshaya` for 6 conduct/policy agents
- Alshaya client "AI Integration of Xero" dashboard at `/embed/dashboard/alshaya-xero` for tax accounting agent
- Alshaya-specific icon mappings (briefcase, clipboard, document, people, gears, chart, construction worker)

## [0.2.3] - 2025-11-04

### Added
- Bellwood multi-agent dashboard with 6 agents at `/embed/dashboard/bellwood` (FA-6)

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
