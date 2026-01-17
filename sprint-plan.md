# sprint-plan.md
# Sprint Plan: TVMaze AI Personalization MVP

## Sprint Breakdown
This implementation is organized into 5 focused sprints, each building on the previous to deliver a production-grade MVP.

---

### Sprint 1: Project Foundation & Infrastructure
Goal: Set up Next.js project, install dependencies, configure environment, and establish database schema.

Tasks:
- Project Initialization
  - Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS
  - Create project structure (app/, components/, lib/, public/)
  - Configure next.config.js and tsconfig.json
- Dependency Installation
  - Install core: @supabase/supabase-js, @tanstack/react-query, @tanstack/react-table
  - Install UI: recharts, framer-motion, lucide-react, class-variance-authority, tailwind-merge
  - Install validation/safety: zod, immer, jsonpath-plus, rate-limiter-flexible
  - Install shadcn/ui components: npx shadcn-ui@latest init (button, input)
  - Install dev tools: vitest, @vitest/ui, @testing-library/react, playwright, eslint, prettier
- Environment Configuration
  - Create .env.local with Supabase and Gemini API keys (not committed)
  - Create .env.example template
  - Configure ESLint and Prettier
- Database Schema (Supabase SQL Editor)
  - Execute SQL to create user_schemas table with RLS policies
  - Execute SQL to create user_schema_versions table with RLS policies
  - Create indexes on user_id columns
  - Test RLS policies for authenticated access

Deliverables: Working Next.js project, all dependencies installed, environment configured, database tables created.

---

### Sprint 2: Core Data Layer & Schema Foundation
Goal: Implement data fetching from TVMaze, create Zod schemas for design and commands, and build command application engine.

Tasks:
- TVMaze Data Endpoints
  - Create app/api/data/route.ts — fetch and normalize shows
  - Create app/api/data/summary/route.ts — compute genre/month aggregations
  - Test endpoints return valid JSON
- Zod Schemas
  - Create lib/designSchema.ts:
    - StyleSchema (theme, fontScale)
    - ComponentBase (id, type, props)
    - LayoutSchema (columns, order)
    - DesignSchema (styles, layout, components with max 30)
  - Create lib/commandsSchema.ts:
    - CommandSchema (discriminated union: set_style, update, add_component, remove_component, move_component, replace_component)
    - CommandListSchema (commands array)
    - Export TypeScript types
- Command Application Engine
  - Create lib/applyCommands.ts:
    - Implement applyCommands() using Immer's produce()
    - Handle each command op with JSONPath resolution
    - Implement resolveIdFromPath() for component ID shorthand
    - Implement moveId() helper for component reordering
    - Add error handling (graceful failures)
  - Unit test command application with various scenarios

Deliverables: TVMaze data endpoints working, complete Zod schemas, immutable command application engine with tests.

---

### Sprint 3: Supabase Auth & Schema Persistence
Goal: Implement user-scoped schema loading, saving, and default schema seeding.

Tasks:
- Supabase Client Setup
  - Create lib/supabase/client.ts for client-side Supabase
  - Create lib/supabase/server.ts for server-side Supabase
  - Build simple mock auth page (login form that sets x-user-id header for MVP)
  - Mock auth: Simple login page at /login that accepts username and sets x-user-id header for subsequent requests
- Schema API Endpoints
  - Create app/api/schema/route.ts:
    - GET: Load user schema (or return default if none exists)
    - POST: Save/upsert user schema with validation
    - Extract user_id from x-user-id header (MVP) or Supabase session (production)
    - Use UUIDs for persisted database rows (user_id, schema id)
    - Use simple fixed IDs for components and tests (e.g., "table1", "chart1", "kpi1")
    - Implement default schema seed on first load:
      - 1-column layout
      - Components: table1, chart1, kpi1 (fixed IDs)
      - Light theme, base font size
    - Validate schemas with DesignSchema before saving
- TanStack Query Setup
  - Configure QueryClient in root layout
  - Set up query hooks for schema loading/saving
  - Configure React Query DevTools (optional)

Deliverables: Schema persistence endpoints working, default schema seeding, TanStack Query configured.

---

### Sprint 4: AI Integration & LLM Endpoint
Goal: Implement Gemini API endpoint that converts natural language to JSON commands.

Tasks:
- Gemini API Endpoint
  - Create app/api/ai/route.ts:
    - Rate limiting with rate-limiter-flexible (20/min per IP)
    - System prompt with command whitelist and JSON format rules
    - Gemini 2.0-flash-lite API call with responseMimeType: "application/json"
    - 10-second timeout handling
    - Parse and validate response with CommandListSchema
    - Return empty commands array on errors
- Error Handling & Safety
  - Timeout handling with AbortSignal.timeout(10000)
  - JSON parse error handling
  - Zod validation errors return empty commands
  - Log errors (don't expose internals to client)
- Testing
  - Unit test prompt → command translation with sample prompts
  - Test rate limiting behavior
  - Test timeout scenarios

Deliverables: Working Gemini API endpoint, rate limiting, robust error handling.

---

### Sprint 5: Frontend Components & Dashboard
Goal: Build UI components, implement dashboard with prompt bar, and wire up end-to-end flow.

Tasks:
- UI Component Library Setup
  - Complete shadcn/ui setup (Button, Input, Table, Toast components)
  - Create components/ui/ directory structure
  - Use default shadcn/ui theme (no custom colors)
  - Install toast notification library (react-hot-toast or shadcn/ui toast)
- Data Display Components
  - Create components/Table.tsx:
    - Wrap TanStack Table with shadcn/ui Table component for styling
    - Render columns: title, rating, genres, premiered
    - Support sortBy and limit props
  - Create components/Chart.tsx:
    - Recharts integration (BarChart)
    - Support groupBy prop (genres or months)
    - Responsive container
  - Create components/KPI.tsx:
    - Display label and value
    - Use summary data for totals
- Dashboard Page
  - Create app/page.tsx (client component):
    - TanStack Query hooks for items, summary, schema
    - State management for current schema (optimistic updates)
    - Prompt input bar with submit button
    - Grid layout rendering based on schema.layout.columns
    - Component rendering based on schema.layout.order
    - Apply theme styles dynamically
    - Implement prompt submission flow:
      - Call /api/ai with prompt + schema
      - Apply returned commands locally with applyCommands() (instant UI update)
      - Optimistically update UI immediately in memory
      - Debounce schema persistence: 300ms debounced POST to /api/schema (use useDebouncedCallback or similar)
      - Single debounced save that overwrites the full schema row (last write wins)
      - Save happens automatically after 300ms of no new commands
    - Add toast notifications for errors (API failures, invalid commands)
- Styling & Polish
  - Apply theme (light/dark) with Tailwind classes
  - Apply fontScale to root font size
  - Add loading states
  - Use toast notifications for error messages (not inline)
- Integration Testing
  - Playwright: Two users see different designs
  - Playwright: Prompt applies and persists on refresh
  - Unit test: Conflicting ops handled correctly

Deliverables: Complete dashboard with working prompt bar, all components rendering, end-to-end flow functional.

---

### Sprint 6: Guardrails, Testing & Documentation
Goal: Add comprehensive guardrails, write tests, and create documentation.

Tasks:
- Guardrail Implementation
  - Enforce 30-component limit in DesignSchema
  - Validate component IDs exist before operations
  - Handle unknown component IDs gracefully
  - Prevent duplicate component IDs
  - Validate command paths resolve correctly
- Test Suite
  - Vitest unit tests:
    - Invalid commands rejected
    - Unknown component IDs ignored
    - Component limit enforced
    - Conflicting ops (remove then update) handled
  - Playwright integration tests:
    - Two sessions show different designs
    - Prompt round-trip < 2s perceived time
    - Persisted schema survives refresh
    - Add/remove/move components work
- Documentation
  - Create README.md:
    - Project overview and goal
    - Setup instructions (env vars, database schema)
    - MVP flow explanation
    - Development commands
    - Architecture overview
    - Add inline code comments for complex logic
    - Document command examples and JSON structure

Deliverables: Complete test suite, all guardrails in place, comprehensive README.

---

## Architecture Overview
- Natural Language Prompt
- POST /api/ai
- JSON Commands
- Updated Schema
- POST /api/schema
- Upsert
- GET
- GET /api/data
- TVMaze API
- User Browser
- Prompt Input
- Gemini API Endpoint
- Command Application Engine
- Dashboard UI
- Schema API
- Supabase DB
- TVMaze Data API
- TVMaze External API
- Table Component
- Chart Component
- KPI Component

## File Structure
```
show-shaperr/
├── app/
│   ├── api/
│   │   ├── ai/route.ts          # Gemini LLM endpoint
│   │   ├── data/route.ts        # TVMaze shows endpoint
│   │   ├── data/summary/route.ts # Aggregations endpoint
│   │   └── schema/route.ts      # Schema GET/POST
│   ├── page.tsx                 # Main dashboard
│   └── layout.tsx               # Root layout with QueryClient
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── Table.tsx
│   ├── Chart.tsx
│   └── KPI.tsx
├── lib/
│   ├── designSchema.ts          # Zod schemas for design
│   ├── commandsSchema.ts        # Zod schemas for commands
│   ├── applyCommands.ts         # Immer + jsonpath command engine
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── .env.local                   # Environment variables
├── README.md
└── package.json
```

## Acceptance Criteria Checklist
- [ ] Two users can have different designs simultaneously
- [ ] "Dark mode, font bigger by 20%, sort table by rating, add bar chart by genre" works end-to-end
- [ ] "Two-column layout, KPIs at top, pie chart by genre" works (bar chart in MVP)
- [ ] Refresh retains each user's design
- [ ] Add/remove/move components without crashing
- [ ] All guardrails prevent crashes
- [ ] Rate limiting prevents abuse
- [ ] Tests cover critical paths

## Dependencies & Constraints
- All dependencies must be free-tier compatible
- Supabase RLS policies enforce user isolation
- Maximum 30 components per schema
- 10-second LLM timeout
- 20 requests per minute rate limit
- MVP uses mock auth page with x-user-id header (production would use Supabase Auth)
- UUIDs for persisted database rows; simple fixed IDs for components and tests
- Optimistic UI updates with 300ms debounced persistence
- Default shadcn/ui theme (no custom colors)

## Risk Mitigation
- LLM API failures: Return empty commands, UI remains stable
- Invalid commands: Zod validation rejects, applyCommands gracefully handles
- Database failures: Show cached schema, queue saves for retry
- TVMaze API down: Show cached data with TanStack Query stale-while-revalidate