# Daily Dev Digest

A personalized daily tech digest that pulls live articles from multiple sources, auto-categorized into **JS/TS**, **AI & GenAI**, and **General Tech**.

![Daily Dev Digest](https://img.shields.io/badge/stack-React%20%2B%20Vite-blue)

## Features

- **Live feeds** from Hacker News and Dev.to
- **Auto-categorization** — HN articles are classified into JS, AI, or Tech based on keywords
- **Filter by category** — quickly focus on what matters to you
- **Save articles** — bookmark interesting reads for later
- **Refresh** — pull fresh content anytime
- **Dark theme** — easy on the eyes for morning reading

## Sources

| Source | Category | What it pulls |
|--------|----------|---------------|
| Hacker News | Auto-detected | Top 12 stories, categorized by keywords |
| Dev.to | JavaScript | Latest JS/TS tagged articles |
| Dev.to | AI | Latest AI tagged articles |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy

### Vercel (recommended)
1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. It auto-detects Vite — just click Deploy

### Netlify
1. Push to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Import repo, set build command to `npm run build` and publish directory to `dist`

## Tech Stack

- React 19
- Vite
- Hacker News API (Firebase)
- Dev.to API
