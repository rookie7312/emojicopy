# EmojiCopy - Emoji Copy & Paste Site

## Overview
An emoji copy-paste website with 400+ emojis organized by category. Users click any emoji to instantly copy it. Includes SEO-optimized pages for 500+ emoji-related keywords.

## Recent Changes
- 2026-02-10: Built complete emoji copy/paste site replacing prior video app
- 400+ emojis seeded across 12 categories
- 311 SEO keyword pages auto-generated
- Click-to-copy with toast notifications and copy count tracking

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter routing + shadcn/ui
- **Backend**: Express API + Drizzle ORM + PostgreSQL (Neon)
- **Database Tables**: `emojis`, `emoji_pages`, `sessions`
- **Styling**: Tailwind CSS with Inter + Fredoka fonts, light theme

## Key Routes
- `/` - Home with all emojis grouped by category
- `/category/:category` - Filter by category
- `/emoji/:slug` - Individual emoji detail page
- `/page/:slug` - SEO content page for a keyword

## API Endpoints
- `GET /api/emojis` - List emojis (supports ?search= and ?category= params)
- `GET /api/emojis/categories` - List all categories
- `GET /api/emojis/trending` - Top copied emojis
- `GET /api/emojis/:slug` - Single emoji by slug
- `POST /api/emojis/:id/copy` - Increment copy count
- `GET /api/pages` - List SEO pages
- `GET /api/pages/:slug` - Single SEO page
- `POST /api/pages/generate` - Generate content for a page
- `POST /api/pages/generate-batch` - Batch generate content

## Project Structure
```
shared/schema.ts        - DB tables (emojis, emoji_pages) + types
shared/routes.ts        - API contract definitions
server/storage.ts       - IStorage interface + DatabaseStorage
server/routes.ts        - Express route handlers + seed logic
server/seed-emojis.ts   - 400+ emoji data + 500 SEO keywords
client/src/pages/Home.tsx       - Main emoji grid + search + categories
client/src/pages/EmojiDetail.tsx - Single emoji detail
client/src/pages/SeoPage.tsx    - SEO content page
```
