# Engineering Reference Guide

## Overview

This is a Next.js starter application that integrates **OpenAI ChatKit** to enable conversational AI workflows. The application provides a minimal, production-ready foundation for building chat interfaces powered by OpenAI's Agent Builder workflows (AgentKit).

**Primary Purpose**: Bootstrap ChatKit-enabled applications with proper session management, theming, and workflow integration.

---

## Technology Stack

### Core Framework
- **Next.js 15.5.4** (App Router) - React-based framework with Edge runtime support
- **React 19.2.0** - UI library with latest concurrent features
- **TypeScript 5** - Type-safe development

### Key Dependencies
- **@openai/chatkit-react** - Official ChatKit web component and React hooks
- **shadcn/ui** - Copy-paste component library built on Radix UI primitives
- **Tailwind CSS 4** - Utility-first styling with PostCSS integration
- **Drizzle ORM 0.44.6** - Type-safe SQL ORM with schema inference
- **pg 8.16.3** - PostgreSQL client with connection pooling
- **drizzle-kit 0.31.5** - Schema migration and introspection toolkit

### Development Tools
- **ESLint 9** - Code quality and standards enforcement
- **Next.js ESLint Config** - Framework-specific linting rules

---

## Architecture

### High-Level Structure

```
openai-chatkit-starter-app/
├── app/                    # Next.js App Router pages and API routes
│   ├── admin/             # Agent management dashboard (no auth)
│   │   └── page.tsx
│   ├── embed/             # Public embeddable agent routes
│   │   └── [slug]/page.tsx
│   ├── page.tsx           # Root page entry
│   ├── layout.tsx         # Root layout wrapper
│   └── api/
│       ├── agents/        # Agent CRUD endpoints
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/route.ts     # PATCH (update), DELETE
│       └── create-session/
│           └── route.ts   # Edge API endpoint for ChatKit session creation
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui components (auto-generated)
│   ├── AgentModal.tsx     # Agent create/edit modal
│   ├── ChatKitPanel.tsx   # ChatKit integration container
│   └── ErrorOverlay.tsx   # Error and loading state UI
├── hooks/                 # Custom React hooks
│   └── useColorScheme.ts  # Theme persistence and system preference detection
├── lib/                   # Shared utilities and configuration
│   ├── db/                # Database layer
│   │   ├── index.ts      # Connection pool and Drizzle instance
│   │   └── schema.ts     # Database schema definitions
│   └── config.ts          # App-wide constants and ChatKit settings
└── public/                # Static assets
```

### Key Architectural Patterns

1. **Client-Server Separation**: ChatKit UI runs client-side; session management happens server-side via Edge runtime
2. **Web Components**: Uses OpenAI's `<openai-chatkit>` custom element for UI rendering
3. **React Hooks Pattern**: Leverages `useChatKit` for workflow integration and state management
4. **Edge Runtime**: API routes run on Edge for low-latency session creation worldwide
5. **Database Layer Pattern**: Singleton connection pool with schema-first type inference via Drizzle ORM
6. **Multi-Agent Pattern**: Database-driven workflow routing enables multiple embeddable agents from single codebase

---

## Database Layer

### Connection Pattern
Uses singleton pattern to prevent connection pool exhaustion during Next.js hot reloads in development. Global variable caching ensures single pool instance across module reloads.

### Schema-First Design
Database schema defined in TypeScript (`lib/db/schema.ts`) serves as single source of truth. Drizzle ORM infers types automatically—no manual type definitions needed.

### Migration Workflow
Schema changes use migration files for production deployments. Run `npm run db:generate` to create migrations from schema changes, `npm run db:migrate` to apply locally. Vercel deployments automatically run migrations via `vercel-build` script before building the application.

### Agents Table Structure
Stores agent configurations with UUID primary keys, unique slugs for URL routing, and workflow IDs for ChatKit integration. Timestamps track creation and modification.

---

## Multi-Agent System

### Dynamic Workflow Routing
Agents stored in PostgreSQL enable multiple ChatKit workflows from a single application. Each agent maps a human-readable slug to an OpenAI workflow ID. Server-side routing (`/embed/[slug]`) fetches agent configuration and passes `workflowId` prop to ChatKitPanel.

### Embed Pattern
Public embed routes are server components that query the database, handle 404s for invalid slugs, and render the same ChatKitPanel used in the main app—but with a different workflow. No client-side routing or state management needed for embeds.

### Admin Interface
Management UI (`/admin`) provides CRUD operations and generates iframe snippets for each agent. No authentication in MVP—add via middleware or route protection as needed for production.

---

## Core Components

### 1. Embed Route Pattern
**Location**: `app/embed/[slug]/page.tsx`

**Pattern**: Direct Server Component → Client Component rendering

**Responsibilities**:
- Queries database for agent configuration by slug
- Returns 404 for invalid/non-existent slugs
- Directly renders `ChatKitPanel` with `workflowId` prop
- No intermediate wrapper components

**Architecture Benefits**:
- Minimal abstraction - follows Next.js App Router conventions
- Self-contained components with clear responsibilities
- Database query happens in Server Component (efficient)
- Full-screen layout achieved through component-level styling

**Example Flow**:
```typescript
// Server Component fetches data
const agents = await db.select().from(agentsTable).where(eq(agentsTable.slug, slug)).limit(1);
if (agents.length === 0) return notFound();

// Directly render Client Component with data
return <ChatKitPanel workflowId={agents[0].workflowId} />;
```

### 2. ChatKitPanel Component
**Location**: `components/ChatKitPanel.tsx`

**Responsibilities**:
- Self-contained ChatKit integration (manages own theme state)
- Initializes ChatKit web component with session credentials
- Accepts optional `workflowId` prop (falls back to environment variable)
- Manages error states (script loading, session creation, integration errors)
- Handles client-side tool invocations (`switch_theme`, `record_fact`)
- Provides theming configuration and starter prompts
- Implements retry logic and widget instance management

**Key Features**:
- **Full-Screen Layout**: Uses `h-screen w-full` flex layout for iframe embedding
- **Theme Management**: Internally uses `useColorScheme` hook (no prop drilling)
- **Optional Callbacks**: `onWidgetAction` and `onResponseEnd` props are optional
- **Session Management**: Calls `/api/create-session` to obtain client secrets
- **Error Recovery**: Tracks retryable vs. non-retryable errors with user-friendly overlays
- **Event Handling**:
  - `onClientTool`: Processes client-side tool calls from the AI workflow
  - `onResponseEnd`: Lifecycle hook for response completion (if provided)
  - `onResponseStart`: Clears integration errors on new responses
  - `onThreadChange`: Resets processed facts when conversation thread changes
  - `onError`: Global error handler for ChatKit events

**Client Tools**:
```typescript
- switch_theme: Toggles between light/dark mode (via internal useColorScheme)
- record_fact: Captures and deduplicates workflow facts (calls optional onWidgetAction)
```

**Important Patterns**:
- Uses `useRef` to track component mount state and prevent memory leaks
- Implements script loading timeout (5 seconds) for ChatKit web component
- Maintains processed facts set to avoid duplicate handling
- Full-screen wrapper: `<main className="flex h-screen w-full flex-col overflow-hidden">`

### 3. Create Session API Route
**Location**: `app/api/create-session/route.ts`

**Responsibilities**:
- Proxies session creation requests to OpenAI's ChatKit API
- Manages user identification via session cookies
- Handles API authentication with OPENAI_API_KEY
- Supports custom API base URLs via CHATKIT_API_BASE env variable

**Flow**:
1. Extract or generate user ID from session cookie (`chatkit_session_id`)
2. Validate workflow ID from request body or environment
3. Make authenticated POST request to `https://api.openai.com/v1/chatkit/sessions`
4. Return `client_secret` and `expires_after` to client
5. Set/refresh session cookie (30-day max age)

**Security Features**:
- HttpOnly cookies to prevent XSS attacks
- SameSite=Lax for CSRF protection
- Secure flag in production environments
- Server-side API key storage (never exposed to client)

**Edge Runtime**: Deployed globally for minimal latency

### 4. Color Scheme Hook
**Location**: `hooks/useColorScheme.ts`

**Responsibilities**:
- Detects system color scheme preference via `prefers-color-scheme` media query
- Persists user preference to localStorage
- Synchronizes theme across browser tabs
- Applies theme to document root with Tailwind dark mode support

**API**:
```typescript
{
  scheme: "light" | "dark",              // Current active scheme
  preference: "light" | "dark" | "system", // User preference
  setScheme: (scheme) => void,           // Direct scheme override
  setPreference: (pref) => void,         // Set preference
  resetPreference: () => void            // Reset to system default
}
```

**Integration Points**:
- Uses `useSyncExternalStore` for React 18+ compatibility
- Listens to system preference changes in real-time
- Syncs across tabs via storage events

### 5. ErrorOverlay Component
**Location**: `components/ErrorOverlay.tsx`

**Purpose**: Displays loading states and error messages with optional retry functionality

**UI States**:
- Loading indicator (e.g., "Loading assistant session...")
- Error messages with actionable retry button
- Backdrop blur effect for visual hierarchy

---

## Configuration

### Environment Variables

**Required**:
- `OPENAI_API_KEY` - API key from the same org/project as your Agent Builder workflow
- `NEXT_PUBLIC_CHATKIT_WORKFLOW_ID` - Workflow ID created in Agent Builder (fallback for non-embed usage)
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:pass@host:port/dbname`)

**Optional**:
- `CHATKIT_API_BASE` - Custom base URL for ChatKit API (defaults to `https://api.openai.com`)

**Setup**:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Application Config
**Location**: `lib/config.ts`

**Configurable Elements**:
```typescript
WORKFLOW_ID              // Workflow identifier
CREATE_SESSION_ENDPOINT  // API route path
STARTER_PROMPTS          // Welcome screen prompt suggestions
PLACEHOLDER_INPUT        // Input field placeholder text
GREETING                 // Initial greeting message
```

**Starter Prompts Format**:
```typescript
{
  label: "Display text",
  prompt: "Actual message sent to AI",
  icon: "circle-question" // Font Awesome icon name
}
```

---

## Data Flow

### Session Initialization Flow

```
User visits embed page (/embed/[slug])
    ↓
Server Component queries database for agent by slug
    ↓
Server Component renders ChatKitPanel with workflowId
    ↓
ChatKitPanel (Client Component) calls getClientSecret()
    ↓
POST /api/create-session
    ↓
Server validates OPENAI_API_KEY + WORKFLOW_ID
    ↓
Server calls OpenAI ChatKit API with user ID
    ↓
OpenAI returns client_secret
    ↓
Server sets session cookie + returns secret
    ↓
useChatKit initializes with client_secret
    ↓
ChatKit web component loads workflow
    ↓
User sees start screen with prompts in full-screen layout
```

### Client Tool Invocation Flow

```
User sends message
    ↓
AI workflow decides to call client tool
    ↓
onClientTool callback triggered
    ↓
ChatKitPanel processes tool invocation
    ↓
For switch_theme: Update useColorScheme state
For record_fact: Call onWidgetAction handler
    ↓
Return {success: true/false} to workflow
    ↓
AI continues conversation based on result
```

### Error Handling Flow

```
Error occurs
    ↓
ChatKitPanel categorizes error:
  - script: Web component loading failure
  - session: API/credential issues
  - integration: Runtime workflow errors
    ↓
Set retryable flag based on error type
    ↓
ErrorOverlay displays message
    ↓
If retryable: Show "Restart chat" button
    ↓
User clicks retry → handleResetChat()
    ↓
Reset state + increment widget key → full reinitialization
```

---

## Theming System

### ChatKit Theme Configuration

**Color System**:
```typescript
grayscale: {
  hue: 220,           // Blue-gray tint
  tint: 6,            // Lightness adjustment
  shade: -1 (dark) / -4 (light)
}

accent: {
  primary: "#f1f5f9" (dark) / "#0f172a" (light),
  level: 1
}
```

**Border Radius**: `"round"` - Fully rounded UI elements

**Color Scheme**: Dynamically set to `"light"` or `"dark"` based on useColorScheme

### Tailwind Dark Mode

**Strategy**: Class-based dark mode via `.dark` class on `<html>`

**Implementation**:
- `useColorScheme` applies `.dark` class to `document.documentElement`
- Sets `data-color-scheme` attribute for custom selectors
- Updates `style.colorScheme` for native form controls

**Usage in Components**:
```tsx
className="bg-slate-100 dark:bg-slate-950"
```

---

## Extension Points

### Adding Custom Client Tools

**In ChatKitPanel.tsx**:
```typescript
onClientTool: async (invocation) => {
  if (invocation.name === "your_custom_tool") {
    const param = invocation.params.your_param;
    // Implement your logic
    return { success: true };
  }
  return { success: false };
}
```

**In Agent Builder**:
1. Define client tool with matching name
2. Specify parameters schema
3. Use tool in workflow logic

### Customizing Starter Prompts

**Edit `lib/config.ts`**:
```typescript
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What can you do?",
    prompt: "What can you do?",
    icon: "circle-question",
  },
  {
    label: "Tell me a joke",
    prompt: "Tell me a funny joke",
    icon: "face-smile",
  },
];
```

**Icon Options**: Any Font Awesome icon name (ChatKit includes icon library)

### Adding Analytics/Tracking

**Recommended Hook Points**:
```typescript
// Pass optional callbacks to ChatKitPanel
<ChatKitPanel
  workflowId={workflowId}
  onWidgetAction={async (action: FactAction) => {
    // Track fact saves to your analytics
    analytics.track('fact_saved', { factId: action.factId });
  }}
  onResponseEnd={() => {
    // Track conversation turns
    analytics.track('ai_response_completed');
  }}
/>
```

### Persisting Conversation State

**Approach 1: Use ChatKit's built-in persistence** (user ID-based sessions)
- Sessions automatically persist via the user ID in the cookie
- No additional code needed

**Approach 2: Export conversation data**
```typescript
// Access ChatKit control methods via ref
const chatkitControl = chatkit.control;

// Export conversation (requires ChatKit API support)
// Refer to ChatKit documentation for available methods
```

---

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
```

**Hot Reload**: Enabled for all components and API routes

### Production Build
```bash
npm run build        # Build optimized bundle
npm start            # Start production server
```

**Optimizations**:
- Static page generation where possible
- Edge runtime for API routes
- Automatic code splitting

### Linting
```bash
npm run lint         # Run ESLint checks
```

---

## Common Integration Patterns

### 1. Multi-User Applications
**Pattern**: Pass authenticated user ID to session creation

**Modify `create-session/route.ts`**:
```typescript
// Replace cookie-based ID with your auth system
const userId = await getAuthenticatedUserId(request);

const upstreamResponse = await fetch(url, {
  // ...
  body: JSON.stringify({
    workflow: { id: resolvedWorkflowId },
    user: userId, // Your authenticated user ID
  }),
});
```

### 2. Multi-Agent Workflow Pattern
**Pattern**: Database-driven workflow selection

Agents table stores multiple workflow configurations. Admin UI manages agents; embed routes dynamically load workflows by slug. ChatKitPanel accepts optional `workflowId` prop that takes precedence over environment variable. This pattern enables a single codebase to serve unlimited ChatKit workflows without redeployment.

### 3. Custom Message Handlers
**Pattern**: React to specific message types from workflow

**In ChatKitPanel**:
```typescript
onResponseEnd: () => {
  // Access the latest message if needed
  // Trigger side effects based on conversation state
  onResponseEnd();
},
```

---

## Troubleshooting

### ChatKit Script Not Loading
**Symptoms**: Error overlay shows "ChatKit web component is unavailable"

**Solutions**:
1. Check network tab for script loading errors
2. Verify CDN accessibility (corporate firewalls may block)
3. Ensure stable internet connection
4. Check browser console for CSP violations

### Session Creation Fails
**Symptoms**: "Failed to create session" error

**Solutions**:
1. Verify `OPENAI_API_KEY` is set in `.env.local`
2. Ensure API key belongs to same org/project as workflow
3. Confirm `NEXT_PUBLIC_CHATKIT_WORKFLOW_ID` is correct
4. Check OpenAI API status page for outages
5. Review server logs for detailed error messages

### Workflow Not Found
**Symptoms**: "Missing workflow id" or 404 errors

**Solutions**:
1. Verify workflow exists in Agent Builder
2. Ensure workflow ID doesn't start with `"wf_replace"` (placeholder)
3. Confirm workflow is published/active
4. Check for typos in environment variable

### Theme Not Persisting
**Symptoms**: Theme resets on page reload

**Solutions**:
1. Check browser localStorage is enabled
2. Verify no browser extensions blocking storage
3. Ensure `useColorScheme` hook is integrated in ChatKitPanel
4. Check for multiple instances of theme management

---

## Security Considerations

### API Key Protection
- **Never expose** `OPENAI_API_KEY` to client-side code
- API key only accessed in server-side Edge route
- Environment variables prefixed with `NEXT_PUBLIC_` are client-accessible

### Session Security
- Session cookies are `HttpOnly` (not accessible via JavaScript)
- `SameSite=Lax` prevents CSRF attacks
- `Secure` flag enforced in production (HTTPS only)
- 30-day expiration limits session lifetime

### User Isolation
- Each user ID gets separate conversation history
- User IDs are random UUIDs (not guessable)
- No cross-user data leakage via session management

---

## Performance Considerations

### Edge Runtime Benefits
- Global deployment reduces latency for session creation
- Cold start times < 100ms (vs. 1-2s for serverless functions)
- Scales automatically with traffic

### ChatKit Web Component
- Lazy-loaded via CDN (not bundled in app)
- Renders independently of React reconciliation
- Maintains own internal state for efficiency

### Optimization Tips
1. **Minimize re-renders**: Use `useCallback` for event handlers
2. **Avoid prop drilling**: Pass only necessary props to ChatKitPanel
3. **Memoize expensive computations**: Use `useMemo` for theme calculations
4. **Debounce analytics calls**: Batch tracking events to reduce overhead

---

## Future Extension Ideas

### Potential Enhancements
1. **Conversation Export**: Add UI to download chat history as JSON/PDF
2. **Voice Input**: Integrate Web Speech API for voice messages
3. **File Attachments**: Add support for image/document uploads (if workflow supports)
4. **Multi-Language**: Implement i18n for UI strings and prompts
5. **Analytics Dashboard**: Build admin panel to view usage metrics
6. **Custom Widgets**: Extend client tools with rich UI components (calendars, forms, etc.)
7. **Mobile Responsive**: Optimize for mobile form factors and gestures

---

## UI Component Library

### shadcn/ui

**Philosophy**: Copy-paste component library built on Radix UI primitives. Components are copied into your codebase (`components/ui/`) and can be customized freely. No runtime dependency on shadcn (it's just a CLI tool).

**Location**: `components/ui/`

**Configuration**: `components.json` at project root

#### When to Use shadcn/ui

Use shadcn for standard UI patterns that benefit from accessibility and consistent behavior:

- **Dialogs & Modals**: Use `<Dialog>` instead of custom fixed-position divs
- **Dropdowns & Menus**: Use `<DropdownMenu>` for better keyboard navigation and focus management
- **Form Controls**: Use `<Input>`, `<Select>`, `<Checkbox>`, `<RadioGroup>` for consistent styling
- **Navigation**: Use `<Tabs>`, `<Accordion>` for interactive content organization
- **Feedback**: Use `<Toast>`, `<Alert>` for user notifications
- **Buttons**: Use `<Button>` for consistent button styles and variants

#### When to Build Custom Components

Build custom components when:

- **ChatKit-specific integrations**: Components that interact with OpenAI ChatKit APIs
- **Domain-specific logic**: Business logic tightly coupled to your application
- **One-off UI**: Unique designs that won't be reused elsewhere
- **shadcn doesn't provide it**: Specialized components not in the shadcn library

#### Adding Components

Add components on-demand using the shadcn CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add select
```

This copies the component source into `components/ui/` where you can customize it.

#### Component Usage Example

```tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ExampleModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example Title</DialogTitle>
          <DialogDescription>
            This dialog uses shadcn/ui components with built-in accessibility.
          </DialogDescription>
        </DialogHeader>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

#### Customization

All shadcn components live in your codebase and can be modified:

- **Styles**: Edit Tailwind classes directly in `components/ui/[component].tsx`
- **Behavior**: Modify component logic as needed
- **Props**: Add custom props to extend functionality
- **Theme**: Configured via CSS variables in `app/globals.css`

#### Accessibility Features

shadcn/ui components include:

- **Focus management**: Automatic focus traps in modals/dialogs
- **ARIA attributes**: Proper labeling for screen readers
- **Keyboard navigation**: Arrow keys, Enter, Escape handling
- **Screen reader support**: Announcements for state changes

#### Documentation

- **Official Docs**: https://ui.shadcn.com/docs
- **Component Reference**: https://ui.shadcn.com/docs/components
- **Radix UI Primitives**: https://www.radix-ui.com/primitives

---

## Resources

### Official Documentation
- [ChatKit JavaScript Library](http://openai.github.io/chatkit-js/)
- [OpenAI Agent Builder](https://platform.openai.com/agent-builder)
- [Advanced Self-Hosting Examples](https://github.com/openai/openai-chatkit-advanced-samples)

### Framework Docs
- [Next.js App Router](https://nextjs.org/docs/app)
- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)

### Related Concepts
- **Agent Builder**: Visual workflow designer for creating AI agents
- **AgentKit**: OpenAI's framework for building autonomous agents
- **ChatKit**: Embeddable chat UI component for OpenAI workflows
- **Edge Runtime**: Lightweight server environment for low-latency APIs

---

## Glossary

- **Workflow**: AI conversation logic defined in Agent Builder
- **Client Secret**: Temporary credential for ChatKit session authentication
- **Client Tool**: Function callable by AI workflow that executes client-side
- **Session**: Stateful conversation instance tied to a user ID
- **Widget Instance Key**: React key that forces ChatKit component remount
- **Fact**: Structured data extracted by workflow and passed to client
- **Start Screen**: Initial UI shown before conversation begins
- **Composer**: Input field where users type messages

---

**Version**: 1.2
**Last Updated**: 2025-11-11 (FA-8: Added shadcn/ui component library infrastructure and documentation)
**Maintainer**: Project Team
