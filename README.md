# TaskFlow — Mini Task Manager

A premium, fully functional personal task manager built with plain HTML, CSS and JavaScript. No build step, no dependencies to install — just open `index.html` in your browser.

## ✨ Features

- **Task CRUD** — create, edit, delete, complete and restore tasks. Press **Enter** in the form to add quickly; empty titles are rejected.
- **Categories** — Personal, Work, Study, Shopping, Other.
- **Priorities** — High, Medium, Low with color-coded badges.
- **Deadlines** — optional date & time with overdue highlighting.
- **Search & filters** — full-text search, status tabs (All / Active / Completed), category filter, priority filter and sorting (newest, oldest, priority, deadline, A–Z).
- **Dashboard statistics** — total, completed, pending, completion percentage, progress bar and donut chart.
- **Views** — Dashboard, My Tasks, Completed, Important and Settings via the sidebar.
- **Dark / Light mode** — toggle from the topbar or sidebar; preference is saved.
- **LocalStorage persistence** — data survives page reloads.
- **Data tools** — export tasks to JSON, import from JSON, load sample tasks and clear all tasks (with confirmation).
- **Toasts** — polished notifications for every action.
- **Responsive design** — collapsible sidebar and adapted layouts for tablet and mobile.
- **Smooth animations, glassmorphism and modern SaaS styling.**

## 📁 Project structure

```
mini-task-manager/
├── index.html   # Markup and structure
├── style.css    # Design system, layout, themes and animations
├── script.js    # State management, CRUD, filters, storage and UI logic
└── README.md    # This file
```

## 🚀 Getting started

1. Download or clone the folder.
2. Open `index.html` in any modern browser.

That's it. Optionally serve the folder locally, e.g.:

```bash
npx serve .
```

## 💾 Storage

Tasks are stored under the `taskflow.tasks.v1` key and preferences under `taskflow.settings.v1` in the browser's LocalStorage. Use **Settings → Export** to back up your data.

## 🛠️ Tech stack

HTML5 · CSS3 (custom properties, grid/flexbox, animations) · Vanilla JavaScript (ES6+) · Font Awesome · Google Fonts (Plus Jakarta Sans) · LocalStorage.
