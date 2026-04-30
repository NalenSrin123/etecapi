# Vue Dashboard

This folder contains a Vue 3 + Vite dashboard for the PHP Teaching API.

## Default API

The dashboard now defaults to the same-origin proxy path:

`/api`

You can still change it in the dashboard if needed.

## Features

- Save API base URL and class API key locally in the browser
- Create a class and automatically keep the returned API key
- Load all products for the selected class
- Upload an image first through `/products/upload`
- Save products using the returned public `image_url`
- Edit and delete products from the dashboard

## Run locally

```bash
cd dashboard
npm install
npm run dev
```

## Production build

```bash
cd dashboard
npm install
npm run build
```

Then deploy the project to Vercel. The frontend is served as static Vite output, and Vercel Functions proxy `/api/*` to `http://etecapi.atwebpages.com/api/*`.

## Important

For local development with `npm run dev`, Vite proxies `/api` to `http://etecapi.atwebpages.com`. On Vercel, the `api/[...path].js` function handles the same proxy in production, which avoids mixed-content and browser CORS issues because the browser only talks to your Vercel origin over HTTPS.
