# Gather

Gather is a small, responsive content-discovery app that helps people find articles, videos, and podcasts they will actually enjoy. It combines editable interests, personalized story ordering, topic and format filters, search, a saved reading shelf, and a daily digest.

## Run locally

1. Install Node.js 18 or newer.
2. From this folder, run `npm start`.
3. Open [http://localhost:3000](http://localhost:3000).

There are no package dependencies to install. Preferences and saved stories stay in your browser using local storage.

## Try Gemini (optional)

The app works immediately in demo mode. To enable live Gemini responses, set an API key in your terminal before starting the server:

```powershell
$env:GEMINI_API_KEY = "your-key"
npm start
```

The key stays on the server and is never sent to the browser. The default model is `gemini-2.5-flash`; set `GEMINI_MODEL` to use a different model available to your API key. AI story insights and a personalized daily digest use the Gemini API when configured.

## Features

- Curated editorial feed, ordered by interests you can change.
- Search, topic browsing, and article/video/podcast filters.
- Saved reading shelf and story previews.
- Daily digest and story insights, with a transparent demo fallback.
- Responsive desktop and mobile layouts.
- Minimal Node server with request validation and server-side API credentials.

Images are loaded from Unsplash, and the interface uses Google Fonts. Both require an internet connection.
