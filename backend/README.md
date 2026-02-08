# FormEngine

FormEngine is a college-focused web platform designed to simplify the creation and management of digital forms for academic and administrative purposes. It allows faculty, student coordinators, and departments to build customizable forms using an intuitive drag-and-drop interface, without requiring technical knowledge.

The platform helps colleges efficiently collect data for use cases such as event registrations, student feedback, surveys, and internal requests, while ensuring accurate and reliable submissions.

---

## Features

- Support for multiple field types
- Built-in validation rules for accurate data collection
- Real-time form preview before publishing
- Secure form publishing with shareable links
- Draft saving and resume support for form responders
- Structured response collection for easy analysis
- Designed specifically for college workflows

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) (for running the database)

### Installation

1. Clone the repository:
   ```bash
   git clone <https://github.com/Nandgopal-R/form-engine.git>
   cd form-engine
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up the environment variables:
   - Copy `.env.example` to `.env` and fill in with your secret keys.

4. Start the database:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   bunx prisma migrate dev
   ```

### Development Scripts

- `bun run dev`: Start the development server with hot-reloading.
- `bun run check`: Run Biome for linting and formatting checks.
- `bun run typecheck`: Run TypeScript type checking.
- `bun run build`: Build the application for production.

### Project Structure

- `src/`: Backend source code.
- `prisma/`: Database schema and migrations.
- `bruno/`: Bruno API collection for testing endpoints.
- `dist/`: Production build output.
