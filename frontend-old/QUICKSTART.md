# Mind Detox - Quick Start Guide

## Get Running in 2 Minutes

### 1. Configure Backend

Edit `js/api.js` line 2:
```javascript
const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI URL
```

### 2. Start Local Server

Choose one:

**Python:**
```bash
python -m http.server 8080
```

**Node.js:**
```bash
npx serve
```

**PHP:**
```bash
php -S localhost:8080
```

### 3. Open Browser

Visit: `http://localhost:8080`

---

## What's Included

✅ **Pure Vanilla JavaScript** - No frameworks, no dependencies  
✅ **Single-page app** - State-based view switching  
✅ **Guest mode** - 2 AI Mirror uses via localStorage  
✅ **JWT auth** - Login/signup with FastAPI  
✅ **Full journal CRUD** - Create, read, update, delete  
✅ **Memories panel** - Slide-in summaries  
✅ **Zen-brutalist design** - Minimal & memorable  

Total size: **~41 KB** uncompressed

---

## File Structure

```
mind-detox-vanilla/
├── index.html              # Single page with all views
├── css/
│   ├── main.css           # Design system
│   ├── header.css         # Navigation
│   ├── mirror.css         # AI Mirror
│   ├── journal.css        # Journal & memories
│   └── auth.css           # Auth modal
└── js/
    ├── api.js             # FastAPI calls
    ├── auth.js            # Authentication
    ├── views.js           # View rendering
    └── app.js             # Main app logic
```

---

## Test the Flow

**As Guest:**
1. Enter thought → Get reflection
2. Use 2 times → Prompted to sign up

**As Authenticated:**
1. Sign up → Unlimited reflections
2. Click "journal" → Create entries
3. Click "show memories" → View summaries

---

## Backend API Needed

Your FastAPI must have:

- `POST /auth/signup` - Create account
- `POST /auth/login` - Sign in
- `GET /auth/me` - Validate token
- `POST /mirror/reflect` - Get reflection
- `GET /journals` - List journals
- `POST /journals` - Create journal
- `PUT /journals/{id}` - Update journal
- `DELETE /journals/{id}` - Delete journal
- `GET /memories` - List memories

Full specs in `README.md`

---

## Common Issues

**CORS errors?**
Add CORS middleware to FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```

**Can't use file://?**
Browsers block fetch from `file://`. Use a local server.

**Guest limit not working?**
Check localStorage in dev tools: `mirrorUsage`

---

## Deploy to Production

1. Change `API_BASE_URL` in `js/api.js` to production URL
2. Upload folder to Netlify, Vercel, or any static host
3. Done! No build step needed.

---

**Pure vanilla. No frameworks. No bloat.**
