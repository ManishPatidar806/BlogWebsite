# Inkwell — Modern Blog Platform

> A handcrafted, premium blog platform for writers and readers. Built with React, FastAPI, PostgreSQL, and AI-powered writing assistance.

![Inkwell Banner](./docs/assets/banner.png)

## ✨ Overview

Inkwell is a production-grade blogging platform designed with a focus on elegant user experience, clean architecture, and powerful features for both writers and readers. The platform integrates Google Gemini AI for intelligent writing assistance.

## 🎯 Features

### For Writers (Authors)
- **Secure Authentication** — JWT-based signup/login with refresh tokens
- **Rich Dashboard** — Statistics, analytics, and post management
- **Live Markdown Editor** — Split-screen with real-time preview
- **AI Writing Assistant** — Grammar fixes, rewrites, title suggestions
- **Draft System** — Auto-save, manual saves, and versioning
- **Profile Management** — Custom bio, avatar, social links

### For Readers
- **Beautiful Reading Experience** — Clean typography, responsive layouts
- **Discovery** — Search, filter by tags/categories, trending posts
- **Engagement** — Like posts, bookmark for later, comments
- **Dark/Light Mode** — Comfortable reading in any environment

### Editor Features
- Split-screen editor with live preview
- Syntax highlighting for code blocks
- Support for tables, images, links, lists
- Word count and reading time estimation
- Undo/Redo with keyboard shortcuts
- Auto-save every 30 seconds

### AI Integration (Google Gemini)
- Fix grammar and spelling
- Improve sentence clarity
- Rewrite paragraphs
- Suggest better headlines
- Optimize readability
- Detect and adjust tone
- Paraphrase content

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React 18 + Vite + React Router + Context API + Tailwind   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                            │
│     FastAPI + SQLAlchemy + Alembic + JWT + Pydantic        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATABASE                            │
│                        PostgreSQL                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                      │
│                 Google Gemini AI API                        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
inkwell/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── context/         # React context providers
│   │   ├── utils/           # Utility functions
│   │   ├── assets/          # Static assets
│   │   └── styles/          # Global styles
│   └── ...
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── auth/            # Authentication
│   │   ├── db/              # Database config
│   │   └── utils/           # Utilities
│   └── ...
│
├── docker/                   # Docker configurations
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/inkwell.git
cd inkwell
```

2. **Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your environment variables
alembic upgrade head      # Run database migrations
uvicorn app.main:app --reload
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env      # Configure your environment variables
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Using Docker

```bash
docker-compose up -d
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inkwell
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Inkwell
```

## 📚 API Documentation

Full API documentation is available at `/docs` when running the backend server (Swagger UI) or `/redoc` for ReDoc format.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/posts` | List all posts |
| POST | `/api/v1/posts` | Create new post |
| GET | `/api/v1/posts/{id}` | Get single post |
| PUT | `/api/v1/posts/{id}` | Update post |
| DELETE | `/api/v1/posts/{id}` | Delete post |
| POST | `/api/v1/ai/improve` | AI improve text |
| POST | `/api/v1/ai/grammar` | AI fix grammar |

## 🎨 Design System

Inkwell uses a custom design system with:

- **Typography**: Inter + Source Serif Pro
- **Colors**: Soft neutral palette with accent highlights
- **Spacing**: 4px base unit system
- **Components**: Glassmorphism, subtle shadows, micro-interactions
- **Animations**: Framer Motion for smooth transitions

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Railway/Render)
```bash
# Using Docker
docker build -t inkwell-backend ./backend
# Push to container registry and deploy
```

### Database (Supabase/RDS)
Configure `DATABASE_URL` in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ by the Inkwell Team

---

**Inkwell** — Write beautifully. Read effortlessly.
