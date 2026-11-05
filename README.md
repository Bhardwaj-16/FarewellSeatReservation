# 🎉 Farewell 2024 — Table Reservation Website

A lightweight, real-time table reservation web app built with **Next.js 16 (App Router)** and **Convex**, with a modern UI with orange accents inspired by [Seating Planner Delta](https://seating-planner-delta.vercel.app/).

---

## 🌟 Key Features

1. **19 Banquet Tables × 8 Seats Each (152 Total Capacity)**
   - Visual floor plan and seat grid with occupancy counters (`X/8`).
   - Quick search by guest name or table number to instantly locate seats.
   - Filter chips: All Tables, Has Empty Seats, Full, and My Table.

2. **👑 "Table Raja" System**
   - The **first person to join an empty table automatically becomes the "Table Raja" 👑**.
   - **Table Raja Exclusive Controls:** Only the Table Raja (or Superuser Admin) can add or remove members for that table.
   - Other users cannot hijack or edit someone else's table.
   - Regular seated members can choose to leave their own seat.
   - If a Table Raja leaves, the crown is automatically passed to the next seated member (or reset if empty).

3. **🚫 Strict Duplicate Prevention & Lowercase Storage**
   - All user account names and table member names are stored in **lowercase**.
   - A guest can only be seated at **one table at a time** across the entire venue.
   - Attempts to seat a guest who is already at another table are blocked with an immediate informative alert.

4. **⚙️ Superuser Admin System**
   - **Admin Credentials:** Username: `admin` | Password: `4469`
   - **Admin Powers:**
     - Add any guest to any table.
     - Remove any guest from any table.
     - Emergency Table Reset to clear all seats.
     - Live overview matrix of all 19 tables with seated member tags.

5. **📢 Real-time Notifications & Announcement Popup**
   - Real-time toast popup appears on screen when a new announcement is posted.
   - Target announcements to:
     - **Broadcast to Everyone**
     - **Target a Specific Table**
     - **Direct Message to a Specific User**
   - Notification history drawer accessible via the top-bar bell icon 🔔 with unread counter.

6. **📱 Lightweight & Mobile-First**
   - Fast loading on mobile browsers and cellular connections.
   - Accessible touch targets (44px+), responsive design, and smooth animations.

---

## 🚀 Running the Project

### Start Everything (Convex Backend + Next.js Frontend):
```bash
./start.sh
```
Or run separately:

**Terminal 1 (Convex):**
```bash
npx convex dev
```

**Terminal 2 (Next.js):**
```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) on your phone or computer.

---

## 🔑 Login Credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| **Superuser (Admin)** | `admin` | `4469` | Full controls, broadcast notifications, bypass table ownership |
| **Students / Guests** | *Any username* | *Any password* | Click "Create Account" on the login screen to register |

---

## 📁 Project Architecture

```
Farewell website/
├── app/
│   ├── layout.tsx                     # Root HTML, fonts, and providers
│   ├── globals.css                    # Tailwind CSS + custom theme
│   ├── ConvexClientProvider.tsx       # Convex real-time client provider
│   ├── context/
│   │   └── AuthContext.tsx            # Session state and local storage
│   ├── components/
│   │   └── NotificationBanner.tsx     # Real-time announcement popup & history modal
│   ├── page.tsx                       # Main floor plan: 19 tables grid, search & filters
│   ├── login/page.tsx                 # Sign In / Create Account with lowercase auto-formatting
│   ├── table/[id]/page.tsx            # 8-seat visual table detail, Raja controls & actions
│   └── admin/page.tsx                 # Superuser panel: announcements, table overrides
├── convex/
│   ├── schema.ts                      # DB schema: tables, users, notifications, sessions
│   ├── tables.ts                      # Table queries, claim Raja, add/remove member logic
│   ├── auth.ts                        # Password hashing, registration, login & session queries
│   └── notifications.ts               # Broadcast & targeted announcements
├── package.json
└── tsconfig.json
```
