# SDB E - Greetings — Invitation Creator

A full-stack web app built with **React + TypeScript + Vite** on the frontend and **Express.js** on the backend. Admins upload template images and define text field positions; users pick a template, fill in details, and download a personalized invitation image.

---

## Project Structure

```
invitation-creator/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
│
├── public/
│   ├── templates/          ← uploaded template images are stored here
│   └── templates.json      ← auto-generated metadata for all templates
│
├── server/
│   └── index.js            ← Express API server (port 3001)
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   └── index.ts        ← shared TypeScript types
    ├── utils/
    │   ├── api.ts          ← Axios calls to the Express API
    │   └── canvas.ts       ← HTML Canvas rendering & image download
    ├── hooks/
    │   └── useTemplates.ts ← data-fetching hook
    ├── components/
    │   ├── FieldEditor.tsx ← admin UI to add/configure text fields
    │   └── TemplatePreview.tsx ← live overlay preview of fields on image
    └── pages/
        ├── AdminPage.tsx   ← /admin route
        └── UserPage.tsx    ← / route
```

---

## How It Works

### Data Model

Each template stored in `public/templates.json` looks like:

```json
{
  "id": "tpl_1700000000000",
  "name": "Wedding Invite 2024",
  "filename": "1700000000000-123456789.png",
  "imageUrl": "/templates/1700000000000-123456789.png",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "fields": [
    {
      "id": "f_1700000000001",
      "label": "Guest Name",
      "key": "name",
      "x": 50,
      "y": 38,
      "fontSize": 48,
      "fontFamily": "Georgia",
      "color": "#2c1810",
      "align": "center",
      "bold": true,
      "italic": false,
      "maxWidth": 70
    }
  ]
}
```

- `x` and `y` are **percentages** of the image dimensions (0–100).
- `maxWidth` is also a **percentage** of the image width — text wraps within this boundary.
- The same data drives both the live CSS preview and the final Canvas render.

### Image Rendering

When the user clicks **Generate & Download**, `src/utils/canvas.ts`:

1. Loads the template image onto an HTML `<canvas>` at its **native resolution**.
2. Converts all `x`, `y`, `maxWidth` percentages to actual pixel values.
3. Renders each text field using `ctx.fillText()` with word-wrapping.
4. Exports the canvas as a PNG `Blob` and triggers a browser download.

### API Endpoints (Express, port 3001)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/templates` | List all templates |
| POST | `/api/templates` | Upload image + metadata (multipart/form-data) |
| PUT | `/api/templates/:id` | Update name or fields |
| DELETE | `/api/templates/:id` | Delete template + image file |
| GET | `/templates/:filename` | Serve static template images |

Vite proxies `/api/*` and `/templates/*` to `localhost:3001` during development.

---

## Getting Started

### 1. Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### 2. Install Dependencies

```bash
cd invitation-creator
npm install
```

### 3. Run in Development

This starts both Vite (port 5173) and Express (port 3001) together:

```bash
npm run dev
```

Open your browser at: **http://localhost:5173**

- **/** → User page (create & download invitations)  
- **/admin** → Admin page (upload & manage templates)

### 4. Build for Production

```bash
npm run build
```

The built frontend goes to `dist/`. For production, serve it with a static server and keep the Express server running alongside it, or configure Express to serve the built `dist/` folder.

---

## Step-by-Step Usage

### Admin: Upload a Template

1. Go to **/admin**
2. Enter a **Template Name** (e.g. "Birthday Party 2024")
3. Click **Choose Template Image** and pick your invitation background (PNG/JPG)
4. Click **Add Field** for each piece of text you want users to fill in:
   - **Label** — what the user sees, e.g. "Guest Name"
   - **Key** — internal identifier, e.g. `name` (no spaces)
   - **X / Y Position** — drag sliders to position the text on the image (%)
   - **Max Width** — how wide the text block can be before wrapping (%)
   - **Font Size, Family, Color, Align, Bold, Italic** — styling options
5. Click **Upload Template** — the image is saved to `public/templates/` and metadata to `public/templates.json`

### Admin: Edit a Template

- Click the **pencil icon** on any saved template card
- Adjust the name or any field settings in the dialog
- Click **Save Changes**

### User: Create an Invitation

1. Go to **/** (home)
2. Click a template to select it
3. Fill in the text fields — the **Live Preview** updates in real time
4. Click **Generate & Download**
5. A PNG file is saved to your downloads folder

---

## Customization

### Adding More Fonts

Edit the `FONTS` array in `src/components/FieldEditor.tsx`:

```typescript
const FONTS = ['Georgia', 'Times New Roman', 'Arial', 'Your Custom Font', ...]
```

If using Google Fonts, add the `<link>` tag to `index.html` and add the font name to the array.

### Output Format

By default images are exported as PNG. To export as JPEG, change the last argument in `canvas.ts`:

```typescript
canvas.toBlob(blob => { ... }, 'image/jpeg', 0.95)
```

### Password-Protecting the Admin Page

For a simple solution, add a password check in `AdminPage.tsx` before rendering the UI, or protect the `/admin` route in `App.tsx`:

```typescript
const ADMIN_PASS = 'your-password'
// Prompt for password on mount, store in sessionStorage
```

For production, use a proper auth solution (JWT, sessions, etc.).

### Production Deployment

1. Run `npm run build` to generate `dist/`
2. In `server/index.js`, add before other routes:
   ```javascript
   import { createRequire } from 'module'
   app.use(express.static(path.join(__dirname, '..', 'dist')))
   app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')))
   ```
3. Deploy the whole folder to a VPS, Railway, Render, etc.
4. Start with: `node server/index.js`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Upload failed. Is the server running?" | Make sure `npm run dev` started both processes. Check port 3001 is free. |
| Image doesn't appear in preview | Check browser console for CORS errors. The Vite proxy should handle this in dev. |
| Text position looks wrong on download | The preview uses CSS %, the canvas uses pixels — verify your image is not being scaled by the browser in unexpected ways. |
| `public/templates.json` not created | The server creates it automatically on first start. Check write permissions on the `public/` folder. |
| Fonts look different on download vs preview | Browser preview uses system/web fonts; canvas renders with whatever fonts the OS has installed. Stick to common fonts (Georgia, Arial, etc.) for consistency. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| UI components | MUI (Material UI) v5 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Image rendering | HTML Canvas API |
| Backend | Express.js (ESM) |
| File uploads | Multer |
| Storage | Local filesystem + JSON file |