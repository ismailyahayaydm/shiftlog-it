# ShiftLog IT — Shift Handover Notes App

A fast, mobile-friendly single-page shift handover notes application for IT support technicians, helpdesk teams, and IT support study.

## Features

- **Thumb-Friendly Incident Logging**: Add notes with title, short description, severity level (Low, Medium, High), and timestamps.
- **Auto-Chronological Feed**: Shift notes sorted newest first with relative and formatted timestamps.
- **Resolve / Reopen Toggles**: Visual distinctions, timestamps, and filters for resolved tickets.
- **Offline Browser Persistence**: Built with `localStorage` so notes stay saved across sessions without needing a backend or login.
- **Shift Handover Export**: One-tap copy to clipboard that generates a structured markdown summary ready to paste into Slack, Microsoft Teams, or ticketing systems.
- **Search & Filters**: Quick search across titles/descriptions, plus filters for active, resolved, and severity levels.

## Tech Stack

- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Vite**
- **Lucide React** (Icons)

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/ismailyahayaydm/shiftlog-it.git

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
