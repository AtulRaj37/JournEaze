# JournEaze Project Setup & Tech Stack

JournEaze is a full-stack SaaS monorepo built for real-time collaborative travel planning.

## 🛠 Tech Stack Overview

### 1. Monorepo Structure (`pnpm`)
The project uses a `pnpm` workspace to manage dependencies cleanly across the frontend, backend, and shared packages.
- **Root**: Contains configuration for linking packages (Next.js ↔ NestJS ↔ Prisma).

### 2. Database Layer (`packages/database`)
- **Database**: PostgreSQL
- **ORM**: Prisma (`schema.prisma`)
- **Purpose**: Defines all the data models and exports a generated Prisma Client custom-tailored for the monorepo to avoid TS compilation issues.

### 3. Backend API (`apps/api`)
- **Framework**: NestJS (Node.js framework for scalable backends)
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens) with Passport.js & bcrypt hashing.
- **Real-time Engine**: Socket.io (NestJS WebSockets) for instant chat, expense splitting updates, and itinerary syncing across the network.
- **AI features**: OpenAI API (`gpt-4` and `gpt-3.5-turbo`) to generate dynamic packing lists, tips, and planned itineraries.
- **Validation & Security**: `class-validator` for DTOs and `@nestjs/throttler` for rate-limiting AI endpoints.

### 4. Frontend Web App (`apps/web`)
- **Framework**: Next.js (React 18 App Router)
- **Styling**: TailwindCSS
- **UI Components**: Shadcn UI & Framer Motion for clean, dynamic interfaces.
- **Data Fetching & State**: TanStack Query (React Query) for async API calls, and Zustand for global UI state.
- **Real-time Sync**: `socket.io-client` utilizing a custom React hook to listen for changes originating from the backend Gateway.

---

## 🚀 How to Set Everything Up Properly

To build and run this exact tech stack without complications, follow these chronological steps:

### Step 1: Install Dependencies
Open your terminal at the root of the project (`~/Desktop/JournEaze`) and install everything using pnpm workspaces:
```bash
pnpm install
```

### Step 2: Configure Environment Variables
You have `.env.example` files. Duplicate them and rename them to `.env`.
1. **API**: In `apps/api/.env`, ensure `DATABASE_URL` points to a running, accessible PostgreSQL database. Add your `OPENAI_API_KEY` and a secure `JWT_SECRET`.
2. **Web**: In `apps/web/.env`, ensure `NEXT_PUBLIC_API_URL` points to your NestJS server (usually `http://localhost:3000`).

### Step 3: Setup the Database
Navigate to the central database package to push your schema and generate the client types:
```bash
cd packages/database
npx prisma db push
npx prisma generate
```

### Step 4: Run the Backend
Navigate to the API folder. You should use the standard NestJS development command to run the backend in watch mode so it recompiles on changes:
```bash
# Return to root, then to API
cd ../../apps/api

# Run NestJS in development mode
pnpm run start:dev
```
*The API will start locally on port 3000.*

### Step 5: Run the Frontend
Open a new, separate terminal window for the frontend.
```bash
cd Desktop/JournEaze/apps/web

# Run Next.js in development mode
pnpm run dev
```
*The Next.js website will start on port 3001.*

### Conclusion
Your database schema is connected to your backend via the `@journeaze/database` package. The backend handles logic, sockets, and AI, then exposes REST endpoints. The frontend (Next.js) consumes those APIs and binds to the real-time Socket.io endpoints to stay fully synchronized!
