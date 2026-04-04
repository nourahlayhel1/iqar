# Atlas Estate Office MVP

Production-usable MVP for a real estate office built with Next.js App Router and TypeScript. It manages properties, customers, and customer requests using JSON files on the server instead of a database.

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## JSON persistence

- Data lives in `/data/properties.json`, `/data/customers.json`, and `/data/requests.json`.
- The frontend never writes to files directly.
- All writes go through `app/api/...` route handlers.
- `lib/data.ts` provides:
  - `readJson<T>()`
  - `writeJson<T>()`
  - `ensureDataFilesExistWithSeed()`
- Writes are best-effort atomic:
  - read the current JSON
  - modify in memory
  - write to a temp file
  - rename the temp file over the original
- A small in-memory lock map serializes concurrent writes per file.

## Features

- Properties: list, full-field search, filters, sorting, details, create, edit, delete
- Customers: list, search, create, edit, delete
- Requests: list, filter by customer, create, edit, delete, find matches

## API routes

- `GET/POST /api/properties`
- `GET/PUT/DELETE /api/properties/[id]`
- `GET/POST /api/customers`
- `GET/PUT/DELETE /api/customers/[id]`
- `GET/POST /api/requests`
- `GET/PUT/DELETE /api/requests/[id]`
- `GET /api/requests/[id]/matches`

## Deployment note

This app requires a Node.js runtime because it reads and writes JSON files on the server. It should not be deployed as a static export.
