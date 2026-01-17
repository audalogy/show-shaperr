# TVMaze AI Personalization MVP

A production-grade Next.js application that enables per-user AI-driven UI personalization over TVMaze data. Users can customize their dashboard layout, components, and styles through natural language prompts powered by Gemini 2.0 Flash Lite.

## Features

- **AI-Driven Customization**: Use natural language to modify UI layouts, components, and styles
- **Per-User Persistence**: Each user's personalized view is saved in Supabase
- **Real-Time Updates**: Optimistic UI updates with 300ms debounced persistence
- **Component Library**: Table, Chart, and KPI components powered by TanStack Table and Recharts
- **Mock Authentication**: Simple mock auth for MVP (production-ready for Supabase Auth)

## Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui, TanStack Table, Recharts, Framer Motion
- **State Management**: TanStack Query
- **Database**: Supabase (PostgreSQL with JSONB)
- **LLM**: Gemini 2.0 Flash Lite (Google AI Studio)
- **Validation**: Zod, Immer, jsonpath-plus
- **Testing**: Vitest, Playwright (test suite to be added)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google AI Studio API key (Gemini)

## Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

### 3. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- User-scoped saved schemas
CREATE TABLE IF NOT EXISTS public.user_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  schema_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_schemas_user_id ON public.user_schemas(user_id);

-- Optional history for rollback
CREATE TABLE IF NOT EXISTS public.user_schema_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  diff_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_schema_versions_user_id ON public.user_schema_versions(user_id);

-- Enable RLS
ALTER TABLE public.user_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schema_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow reads/writes only for authenticated user's user_id)
CREATE POLICY "Users can view their own schemas"
  ON public.user_schemas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schemas"
  ON public.user_schemas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schemas"
  ON public.user_schemas FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/login` to start using the application.

## Usage

1. **Login**: Enter any user ID (e.g., "user-123") on the login page
2. **View Dashboard**: You'll see the default dashboard with:
   - A table of TV shows
   - A bar chart showing genres
   - A KPI showing total shows
3. **Customize**: Use the prompt bar to modify your view:
   - "Make it dark mode"
   - "Bigger text by 20%"
   - "Sort table by rating, top 10"
   - "Two-column layout"
   - "Add a bar chart by genre"

Changes are applied instantly and saved automatically after 300ms of inactivity.

## Project Structure

```
show-shaperr/
├── app/
│   ├── api/
│   │   ├── ai/route.ts          # Gemini LLM endpoint
│   │   ├── data/route.ts        # TVMaze shows endpoint
│   │   ├── data/summary/route.ts # Aggregations endpoint
│   │   └── schema/route.ts      # Schema GET/POST
│   ├── login/page.tsx           # Mock auth page
│   ├── page.tsx                 # Main dashboard
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # TanStack Query provider
│   └── globals.css              # Tailwind styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── Table.tsx                # TV shows table
│   ├── Chart.tsx                # Bar chart component
│   └── KPI.tsx                  # KPI display component
├── lib/
│   ├── designSchema.ts          # Zod schemas for design
│   ├── commandsSchema.ts        # Zod schemas for commands
│   ├── applyCommands.ts         # Command application engine
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   └── server.ts            # Server-side Supabase
│   └── utils.ts                 # Utility functions
└── README.md
```

## Command Examples

The LLM translates natural language into JSON commands:

**User**: "Make it dark mode, bigger text, top 10 by rating"

**LLM Output**:
```json
{
  "commands": [
    { "op": "set_style", "path": "$.styles", "value": { "theme": "dark", "fontScale": 1.2 } },
    { "op": "update", "path": "/components[id=table1]", "value": { "props": { "sortBy": "rating", "limit": 10 } } }
  ]
}
```

## Guardrails

- **Schema Validation**: All schemas and commands validated with Zod
- **Component Limit**: Maximum 30 components per schema
- **Rate Limiting**: 20 requests per minute for AI endpoint
- **Timeout**: 10-second timeout on LLM requests
- **Error Handling**: Graceful failures with toast notifications

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint
npm run lint

# Test (to be implemented)
npm run test

# E2E Tests (to be implemented)
npm run test:e2e
```

## MVP Notes

- Uses `x-user-id` header for authentication (mock auth page sets localStorage)
- Default shadcn/ui theme (no custom colors)
- UUIDs for persisted database rows; simple fixed IDs (e.g., "table1") for components
- Optimistic updates with 300ms debounced persistence
- Toast notifications for errors

## Production Considerations

- Replace mock auth with Supabase Auth
- Add comprehensive test suite
- Implement error boundaries
- Add loading skeletons
- Optimize bundle size
- Add analytics

## License

ISC
