# 📦 Project Prompt: Invited+
A **smart, collaborative, invite‑only event & task management platform**

---

## 📝 1. Summary
Invited+ empowers organizers to build, manage, and analyze both public and private events—with integrated task management, real‑time collaboration, logistics automation, deep integrations, and end‑to‑end DevOps.

---

## 🧩 2. Core Features (MVP)

### 🔐 Authentication & Security
- Email / Password signup + login (JWT)
- OAuth2 login (Google, GitHub)
- Email verification on signup
- “Forgot password” & secure reset links
- Role‑based access (Admin, Organizer, Guest)

### 📅 Event & Invitation Management
- CRUD operations on events (public or invite‑only)
- Unique invite‑code generation per event
- Send email invitations with RSVP links
- RSVP workflow: guests confirm attendance & answer custom questions
- Export guest lists (CSV)

### 📋 Task Management
- Create/edit/delete tasks tied to events
- Drag‑and‑drop board (To Do / In Progress / Done)
- Assign tasks to users, set due dates & priorities
- Task‑status overview in organizer dashboard

### 🛠 DevOps Foundations
- Dockerized frontend, backend, database
- NGINX reverse proxy with SSL termination
- GitHub Actions CI: lint, test, build, deploy
- GitLab CI pipeline for staging & backup
- Centralized logging via Winston
- Basic monitoring (Prometheus + Grafana or similar)

---

## 🌟 3. Enhanced (Non‑AI) Features

### 3.1 Real‑Time Collaboration
- **WebSocket Chat & Announcements**  
  Live in‑app chat and broadcast messages (e.g. “Venue moved!”).  
- **Topic Rooms**  
  Themed chatrooms for guests (e.g. “Travel buddies”).

### 3.2 Dynamic Agenda & Engagement
- **Collaborative Agenda Builder**  
  Guests vote on session topics and times; agenda updates in real time.  
- **Live Polls & Q&A**  
  Run polls during the event; display results instantly on the event page.

### 3.3 Logistics & On‑Site Automation
- **QR‑Code Check‑In**  
  Generate unique QR codes per guest for rapid entry scanning.  
- **Seating Planner**  
  Drag‑and‑drop seating map that auto‑assigns based on RSVP data (dietary, VIP).

### 3.4 Deep Integrations
- **Calendar Sync**  
  One‑click export to Google/Outlook calendars (ICS).  
- **Payments & Ticketing**  
  Stripe integration to sell tickets or accept donations, with digital receipts.  
- **Social Share Cards**  
  Auto‑generated Open Graph images so guests can promote events on social media.

### 3.5 Advanced Analytics & Reporting
- **Post‑Event Dashboard**  
  Demographics breakdown, RSVP conversion rates, task completion stats, budget vs. spend.

### 3.6 White‑Label & Multi‑Tenant
- **Industry Templates**  
  Preconfigured workflows and email sequences for weddings, conferences, hackathons.  
- **Custom Branding**  
  Custom domains, logos, and color schemes per organization.

### 3.7 PWA & Accessibility
- **Offline‑Capable PWA**  
  Guests can view event details without connectivity.  
- **Push Notifications**  
  Reminders (“Your session starts in 15 min”) delivered to phones.  
- **WCAG 2.1 Compliance**  
  Keyboard navigation, high‑contrast modes, ARIA labels.

### 3.8 Gamification & Community
- **Guest Leaderboards**  
  Badges for earliest RSVPs or most event shares.  
- **Discussion Forums**  
  Private post‑event forums for networking and feedback.

---

## 🛠 4. Technology Stack

| Layer          | Technology / Tool                       |
|--------------- |-----------------------------------------|
| Frontend       | Next.js 14+ (App Router), Tailwind CSS, React‑Hook‑Form |
| Backend        | NestJS (TypeScript), Prisma ORM         |
| Database       | SQLite                                  |
| Auth           | JWT, OAuth2 (Passport strategies)       |
| Email Service  | Nodemailer or Resend                    |
| Realtime       | WebSockets (NestJS Gateway)             |
| CI/CD          | GitHub Actions, GitLab CI               |
| Containers     | Docker, Docker Compose                  |
| Reverse Proxy  | NGINX                                   |
| Logging        | Winston                                 |
| Monitoring     | Prometheus + Grafana (or hosted alt.)   |
| Infrastructure | Terraform / Pulumi (optional)           |

---

## 📁 5. Suggested Folder Structure

```
invited-plus/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             
│   │   ├── events/
│   │   ├── invites/
│   │   ├── tasks/
│   │   ├── chat/
│   │   ├── polls/
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
├── frontend/                 # Next.js App
│   ├── app/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── tasks/
│   │   ├── chat/
│   │   ├── polls/
│   │   └── layout.tsx
│   ├── components/
│   └── Dockerfile
├── nginx/
│   └── default.conf
├── docker-compose.yml
├── .github/
│   └── workflows/            
├── .gitlab-ci.yml
└── README.md
```

---

## 🚀 6. Development Roadmap

| Phase           | Tasks                                                                                  |
|-----------------|----------------------------------------------------------------------------------------|
| **Phase 1: Setup & MVP**     | • Init repo, Docker Compose, Prisma schema<br>• Basic auth (JWT + email)<br>• Event CRUD + invite codes<br>• RSVP flow & email notifications |
| **Phase 2: UI & Task Board** | • Next.js forms and pages (auth, events, RSVP)<br>• Task CRUD + drag‑drop UI<br>• Organizer dashboard |
| **Phase 3: DevOps Core**     | • Dockerize all services<br>• NGINX reverse proxy<br>• GitHub Actions CI/CD<br>• Winston logging |
| **Phase 4: Real‑Time & Engagement** | • WebSocket chat & announcements<br>• Collaborative agenda builder<br>• Live polls & Q&A |
| **Phase 5: Logistics & Integrations**    | • QR‑code check‑in & seating planner<br>• Calendar sync, Stripe payments, social share cards |
| **Phase 6: Scale & Polish**  | • PWA support & push notifications<br>• White‑label templates & multi‑tenant<br>• Prometheus/Grafana dashboards<br>• Terraform/IaC |

---

## 📋 7. Deliverables

1. **Source code** on GitHub (frontend + backend)  
2. **Docker Compose** setup for local & production  
3. **CI/CD pipelines** in GitHub Actions & GitLab  
4. **Live demo URL** with SSL via NGINX  
5. **Monitoring dashboard** (or logs endpoint)  
6. **Complete README** with setup, env variables, and usage  
7. **API documentation** (Swagger for NestJS)  

---

## 🔑 8. Credentials & Access

- OAuth client IDs / secrets (Google, GitHub)  
- SMTP credentials for email service  
- Stripe API keys (for payments)  
- Domain & SSL cert (Let’s Encrypt or other)  
- DockerHub or registry access  
- Hosting/VPS access (Render, Railway, or own server)  
