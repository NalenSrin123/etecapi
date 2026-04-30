# Vue Dashboard

This folder contains a Vue 3 + Vite dashboard for the PHP Teaching API.

## Default API

The dashboard now defaults to this hosted API:

`http://etecapi.atwebpages.com/api`

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

Then deploy the built files from `dashboard/dist/` to your hosting account.

## Important

If you run the Vue dashboard on a different domain or port from the PHP API, your PHP API must allow CORS. If you deploy the built dashboard on the same domain as the API, the current setup is much simpler.

For local development with `npm run dev`, Vite now proxies `/api` to `http://etecapi.atwebpages.com`, so browser CORS errors are avoided during development. Production deployments still need proper CORS headers unless the frontend and API are served from the same origin.
