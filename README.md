# ScoreKeeper

A web application to track scores for card games. It supports cross-device synchronization using Supabase.

## Features

- **Game and Player Management**: Easily set up games and add players.
- **Score Tracking**: Keep track of scores for each round of your favorite card games.
- **Cross-Device Sync**: Use Supabase to sync game state across multiple devices in real-time.
- **Offline Support**: The application works seamlessly offline by falling back to `localStorage`.
- **Game History**: Review the history of each game.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)

## Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
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

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the codebase.
- `npm run preview`: Serves the production build locally.
