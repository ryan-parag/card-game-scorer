# ScoreKeeper

A web application for tracking scores in card games and leagues, with accounts, cross-device sync, and shareable results.

## Features

- **Game and Player Management**: Set up games, add players, and track scores round by round for standard or custom scoring rules.
- **Voice Score Entry**: Enter scores by voice instead of typing them in.
- **Win Probability & Progress Charts**: Live win-probability indicators and score/season progress charts as a game unfolds.
- **Leagues & Seasons**: Group games into leagues and seasons, with leaderboards across a league's history.
- **Accounts & Social**: Sign up/sign in, public profiles, and finding other players.
- **Game Sharing**: Share a finished game via a link or Slack, including an auto-generated OG preview image.
- **Cross-Device Sync**: Supabase-backed sync keeps game state consistent across devices in real time.
- **Offline Support**: Falls back to `localStorage` when Supabase isn't configured or reachable.
- **Game History**: Review the full history of a game, with undo support.
- **Changelog**: A public `/changelog` page of user-facing updates (see `src/data/changelog.ts`).

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Supabase (PostgreSQL), Vercel serverless functions (`/api`)
- **Testing/Dev**: Vitest, Storybook

## Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ryan-parag/card-game-scorer.git
    cd card-game-scorer
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Supabase (Optional):**

    This application can use Supabase for backend services. If you want to enable cross-device synchronization, follow the instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

    If you choose not to set up Supabase, the application will use `localStorage` for data persistence.

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

### Running API routes locally

The `/api` directory contains Vercel serverless functions (game sharing, OG image generation, Slack notifications, invites). To run these locally alongside the frontend, use:

```bash
npm run dev:api
```

This requires the [Vercel CLI](https://vercel.com/docs/cli).

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run dev:api`: Runs the app with Vercel's local dev server, including `/api` routes.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the codebase.
- `npm run preview`: Serves the production build locally.
- `npm run storybook`: Runs Storybook for isolated component development.
- `npm run build-storybook`: Builds a static Storybook deployment.
