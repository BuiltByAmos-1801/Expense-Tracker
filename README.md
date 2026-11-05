# Expense Tracker

A mobile-first, offline-first personal expense tracker built with HTML, CSS and vanilla JavaScript.

## Run it
1. Extract the ZIP file.
2. Open `index.html` in a modern browser (Chrome or Edge recommended).
3. Add expenses using amount, category, payment method, date, time and optional description.

For the best file-system support, run it from `localhost` or HTTPS. You can use VS Code Live Server, or run:
- Python: `python -m http.server 8000`
- Then open `http://localhost:8000`

## Data storage
- Transactions are automatically stored in the browser's LocalStorage on the current device/browser.
- Use **Export JSON** to download a portable backup.
- Use **Import JSON** to restore a backup. Import replaces the current browser data after confirmation.
- In browsers supporting the File System Access API (typically Chrome/Edge on HTTPS or localhost), **Save / link JSON file** creates/links a JSON file. While this page remains open, new, edited and deleted expenses are written to that file.

## Important
LocalStorage is browser/device-specific. Clearing browser site data can erase the local copy. Export JSON backups regularly and keep a copy somewhere safe. A linked JSON file is not a cloud sync service.
