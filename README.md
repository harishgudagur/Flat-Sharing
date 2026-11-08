# Flatmate Matching and Rent Splitting Platform

> Find your people. Share your space.

A full-stack, modular platform designed for finding compatible flatmates, real-time messaging, and managing rent-splitting groups.

---

## 🏗 Technology Stack

- **Mobile Application**: Flutter + Dart (`apps/mobile`)
- **Public Website**: Next.js + TypeScript (`apps/website`)
- **Admin Dashboard**: Next.js + TypeScript (`apps/admin`)
- **Backend**: NestJS + TypeScript (`backend`)
- **Database**: PostgreSQL 16 (Containerized)
- **ORM**: Prisma
- **API**: REST & WebSockets

---

## 📁 Repository Structure

```text
flatmate-platform/
├── AGENTS.md
├── ANTIGRAVITY.md
├── docker-compose.yml
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── UI_DESIGN.md
│   ├── SECURITY_CHECKLIST.md
│   ├── DEVELOPMENT_ROADMAP.md
│   └── FEATURE_PROMPTS.md
├── apps/
│   ├── mobile/         # Flutter Mobile App
│   ├── website/        # Next.js Public Website
│   └── admin/          # Next.js Admin Dashboard
├── backend/            # NestJS Modular Backend
└── README.md
```

---

## 🚀 Quick Start (Dockerized Backend & Database)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Running)
- [Node.js](https://nodejs.org/) (v20+ or v24+)
- [Flutter SDK](https://flutter.dev/) (v3.24+)

### 2. Start Database & Backend with Docker Compose
```bash
# Start PostgreSQL database and NestJS backend
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

### 3. Run Frontends Locally

#### Next.js Public Website
```bash
cd apps/website
npm install
npm run dev
# Running on http://localhost:3000
```

#### Next.js Admin Dashboard
```bash
cd apps/admin
npm install
npm run dev -- -p 3001
# Running on http://localhost:3001
```

#### Flutter Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 🔒 Security & Guidelines
See [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) for mandatory security implementation requirements.

