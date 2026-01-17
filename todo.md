# todo.md


1. Initialize Next.js project, install all dependencies, configure environment variables, and create Supabase database tables with RLS policies
2. Implement TVMaze data endpoints, create Zod schemas (designSchema.ts, commandsSchema.ts), and build command application engine with Immer + jsonpath-plus
3. Set up Supabase clients, implement schema GET/POST endpoints with default schema seeding, and configure TanStack Query
4. Build Gemini API endpoint with rate limiting, timeout handling, and command translation from natural language to JSON
5. Create Table, Chart, KPI components, build dashboard page with prompt bar, and wire up end-to-end flow (prompt → AI → apply → persist)
6. Implement all guardrails, write comprehensive test suite (Vitest + Playwright), and create README documentation