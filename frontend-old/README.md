# Mind Detox - Vanilla JavaScript Frontend

A minimal, zen-brutalist single-page application built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no dependencies.

## ⚠️ Architecture

**Pure Vanilla Stack:**
- HTML5 (single page)
- CSS3 (modular stylesheets)
- Vanilla JavaScript (no frameworks)
- FastAPI backend (REST JSON)

**No React, Vue, Angular, Tailwind, Bootstrap, or any libraries.**

## Features

### Guest Users
- AI Mirror: 2 free reflections (localStorage tracking)
- Login/Signup prompts
- Locked journal view

### Authenticated Users
- **Unlimited AI Mirror**: Get non-directive reflections
- **Private Journal**: Full CRUD operations
- **Memories Panel**: View summaries of past entries
- JWT-based authentication

## Quick Start

### 1. Configure Backend URL

Edit `js/api.js` and set your FastAPI backend URL:

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Change this
```

### 2. Serve the Application

You need a local web server (browsers block fetch requests from `file://` URLs).

**Option A: Python**
```bash
python -m http.server 8080
```

**Option B: Node.js**
```bash
npx serve
```

**Option C: PHP**
```bash
php -S localhost:8080
```

### 3. Open in Browser

Visit: `http://localhost:8080`

## Project Structure

```
mind-detox-vanilla/
├── index.html              # Single HTML file with all views
├── css/
│   ├── main.css           # Design system & global styles
│   ├── header.css         # Header navigation
│   ├── mirror.css         # AI Mirror view
│   ├── journal.css        # Journal & memories panel
│   └── auth.css           # Authentication modal
├── js/
│   ├── api.js             # API service layer (FastAPI calls)
│   ├── auth.js            # Authentication handler
│   ├── views.js           # View rendering & state
│   └── app.js             # Main app logic & events
└── README.md
```

## How It Works

### State Management
The app uses a simple state object pattern:

- `Auth.isAuthenticated` - Boolean auth status
- `Views.currentView` - 'mirror' | 'journal'
- `localStorage` - Guest limits & JWT token

### View Switching
Pure JavaScript DOM manipulation:

```javascript
Views.showView('mirror'); // Show AI Mirror
Views.showView('journal'); // Show Journal
```

All views exist in the HTML, toggled with `display: none/block`.

### API Communication
REST calls via Fetch API:

```javascript
const response = await API.mirror.reflect(text);
const journals = await API.journal.getAll();
```

JWT token automatically attached to authenticated requests.

## Backend API Requirements

Your FastAPI backend must implement these endpoints:

### Authentication
```
POST /auth/signup
Body: { name, email, password }
Response: { user: {...}, token: "jwt_token" }

POST /auth/login
Body: { email, password }
Response: { user: {...}, token: "jwt_token" }

GET /auth/me
Headers: Authorization: Bearer {token}
Response: { id, name, email }
```

### AI Mirror
```
POST /mirror/reflect
Headers: Authorization: Bearer {token} (optional for guests)
Body: { text: "user's thoughts" }
Response: { id, content: "reflection", created_at }

POST /mirror/{id}/save-as-journal
Headers: Authorization: Bearer {token}
Response: { journal_id }
```

### Journals
```
GET /journals
Headers: Authorization: Bearer {token}
Response: [{ id, title, content, created_at, updated_at }]

POST /journals
Headers: Authorization: Bearer {token}
Body: { title, content }
Response: { id, title, content, created_at }

PUT /journals/{id}
Headers: Authorization: Bearer {token}
Body: { title, content }
Response: { id, title, content, updated_at }

DELETE /journals/{id}
Headers: Authorization: Bearer {token}
Response: { success: true }
```

### Memories
```
GET /memories
Headers: Authorization: Bearer {token}
Response: [{ id, title, summary, created_at }]
```

## Key Behaviors

### Guest Limits
- AI Mirror: 2 uses maximum
- Tracked in `localStorage.mirrorUsage`
- After limit, input locked + signup CTA
- Counter resets on new signup

### Authentication Flow
1. User clicks Login/Signup
2. Modal appears
3. Credentials sent to FastAPI
4. JWT stored in localStorage
5. App state updates
6. Full features unlocked

### Journal Editing
- Click "new entry" or "edit" on existing
- Editor appears (inline, no navigation)
- Save/Cancel buttons
- Auto-refresh list after save

### Memories Panel
- Slides in from right
- Shows summaries only
- Click to expand details
- Separate from journal content

## Design System

### Typography
- **Headers**: Crimson Pro (serif, 300 weight)
- **Body**: DM Sans (sans-serif)

### Colors
```css
--color-bg: #fafaf8          /* Off-white background */
--color-surface: #ffffff     /* Card background */
--color-text: #1a1a1a       /* Primary text */
--color-text-muted: #6b6b6b /* Secondary text */
--color-accent: #4a7c7e     /* Muted teal accent */
--color-border: #e5e5e0     /* Subtle borders */
```

### Aesthetic
- **Zen brutalism**: Minimal but bold
- Generous whitespace
- Clean typography
- Subtle animations
- No clutter

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

**Minimum:** ES6+ support required (async/await, fetch, template literals)

## Development Tips

### Debugging
Open browser console to see:
- API requests/responses
- Auth state changes
- Error messages

### Testing Guest Limits
Clear localStorage to reset:
```javascript
localStorage.removeItem('mirrorUsage');
```

### Testing Auth
Check token:
```javascript
console.log(localStorage.getItem('authToken'));
```

### CORS Issues
If you get CORS errors, your FastAPI backend needs:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Production Deployment

### 1. Update API URL
Change `API_BASE_URL` in `js/api.js` to your production backend.

### 2. Deploy Static Files
Upload all files to:
- **Netlify**: Drag & drop the folder
- **Vercel**: `vercel --prod`
- **AWS S3**: Bucket + CloudFront
- **GitHub Pages**: Push to gh-pages branch
- **Any static hosting**

### 3. HTTPS Required
For production, both frontend and backend must use HTTPS (browsers restrict mixed content).

## Security Notes

- JWT stored in localStorage (consider httpOnly cookies for production)
- All API calls use HTTPS in production
- Input sanitization on backend (XSS prevention)
- CORS properly configured
- Rate limiting on backend recommended

## UX Principles

✅ **DO:**
- Keep language calm, minimal
- Use "reflection" not "therapy"
- Respect boundaries (mirror vs journal vs memory)
- Show clear state (guest vs authenticated)

❌ **DON'T:**
- Use therapy/medical framing
- Give advice in reflections
- Mix journal with memories display
- Create complex navigation
- Overwhelm with options

## File Sizes

Total bundle size (uncompressed):
- HTML: ~8 KB
- CSS: ~15 KB
- JavaScript: ~18 KB
- **Total: ~41 KB**

No build step, no dependencies, instant load.

## Troubleshooting

**"Failed to fetch" errors:**
- Check `API_BASE_URL` in `js/api.js`
- Verify FastAPI is running
- Check browser console for CORS errors
- Use a local server (not `file://`)

**Auth not persisting:**
- Check localStorage in dev tools
- Verify `/auth/me` endpoint works
- Check JWT expiry

**Guest limit not working:**
- Check localStorage: `mirrorUsage`
- Clear and retry

**Blank page:**
- Check browser console for errors
- Verify all JS files loaded
- Check file paths are correct

## License

MIT

---

**Pure vanilla. No frameworks. No build step. Just HTML, CSS, and JavaScript.**
