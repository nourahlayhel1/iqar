# Angular Frontend

Standalone Angular 17+ frontend for the existing Next.js backend.

## Run locally

1. Start the Next.js backend from the project root:

```bash
npm install
npm run dev
```

The backend runs on `http://localhost:3000`.

2. Start the Angular frontend from `/frontend-angular`:

```bash
npm install
npm start
```

The Angular app runs on `http://localhost:4200`.

## API base URL

Default API base URL is configured in:

- `src/environments/environment.ts`
- shared color tokens live in `src/styles/_colors.scss`
- the header logo placeholder lives in `src/assets/logo-placeholder.svg`

Default value:

```ts
apiBaseUrl: 'http://localhost:3000'
```

## CORS

The Next.js API was updated for development-only CORS support for:

- `http://localhost:4200`

This only adds response headers and `OPTIONS` handling. Backend data behavior and route logic were not changed.

## Implemented routes

- `/properties`
- `/properties/new`
- `/properties/:id`
- `/properties/:id/edit`
- `/customers`
- `/customers/new`
- `/customers/:id`
- `/customers/:id/edit`
- `/requests`
- `/requests/new`
- `/requests/:id/edit`

## Notes

- Property list filters and search are passed directly to the existing backend API.
- Forms use Angular reactive forms.
- Request matching calls `GET /api/requests/:id/matches`.
- Replace `src/assets/logo-placeholder.svg` with your real logo when ready, or update the header image path.
