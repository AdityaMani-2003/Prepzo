<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

# 🎯 Prepzo — AI Interview Preparation Platform

Prepzo is a production-grade AI-powered interview preparation SaaS that helps candidates ace their next technical interview. It generates contextual questions based on your resume, evaluates your answers in real-time, tracks your progress with an ELO rating system, and builds personalized improvement plans — all powered by Google's Gemini AI.

> **[🔗 Live Demo → https://prepzo-one.vercel.app](https://prepzo-one.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Mock Interviews** | Real-time question generation & answer evaluation with streaming AI responses |
| 📄 **Resume Intelligence** | Upload your resume for AI-powered skill extraction and contextual interview questions |
| 📊 **Performance Analytics** | ELO rating system, skill breakdowns, and trend analysis with interactive charts |
| 📈 **7-Day Improvement Plan** | Personalized AI-generated study plans based on your weak areas |
| ⬇️ **Download Plan** | Export your improvement plan as PDF or plain text |
| 🗂️ **Interview History** | Browse and review all past interview sessions and evaluations |
| 🎙️ **Voice Input** | Native speech recognition for hands-free interview practice |
| 🔊 **AI Voice Feedback** | Text-to-speech dictation of AI evaluation results |
| 🌗 **Theme Support** | Dark mode–first design with light mode toggle |
| 🔐 **Secure Auth** | Google OAuth via Supabase with row-level security |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Frontend** | React 19, Tailwind CSS v4, Framer Motion |
| **AI Engine** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Database** | Supabase (PostgreSQL + pgvector for RAG) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Charts** | Recharts |
| **PDF** | jsPDF (client-side generation), pdf-parse + Gemini OCR (server-side parsing) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/prepzo.git
cd prepzo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys (see section below)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous/public key |
| `GEMINI_API_KEY` | Server only | Google Gemini API key (never exposed to browser) |

> ⚠️ **Security**: `GEMINI_API_KEY` is **server-side only** and is never bundled into client code. All AI operations happen exclusively in API routes.

---

## 📁 Project Structure

```
prepzo/
├── app/
│   ├── (dashboard)/        # Authenticated dashboard routes
│   │   ├── dashboard/      # Main dashboard with stats & streak
│   │   ├── interview/      # AI interview flow (text + voice)
│   │   ├── progress/       # Analytics, charts & improvement plan
│   │   ├── history/        # Past interview sessions
│   │   ├── resume/         # Resume upload & AI analysis
│   │   └── settings/       # User profile & preferences
│   ├── api/                # Server-side API routes
│   │   ├── evaluate/       # Answer evaluation endpoint
│   │   ├── stream-question/# SSE streaming question generation
│   │   ├── follow-up/      # Follow-up question generation
│   │   ├── resume/         # Resume storage + RAG embedding
│   │   ├── improvement-plan/ # AI improvement plan generation
│   │   └── parse-resume/   # PDF parsing + Gemini OCR fallback
│   ├── login/              # Authentication page
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks (useVoice, useStreamAI)
├── lib/                    # Supabase clients & Gemini AI wrapper
├── services/               # AI service layer (prompts & parsing)
├── utils/                  # Utility functions (parseAI, etc.)
└── proxy.ts                # Auth middleware
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🗄️ Database Setup

Prepzo uses Supabase with the following tables:

- **`resumes`** — Stores uploaded resume text per user
- **`resume_embeddings`** — pgvector embeddings for RAG-based contextual interviews
- **`interview_sessions`** — Interview session metadata
- **`interview_messages`** — Questions, answers, and evaluation scores

> All tables enforce **Row Level Security (RLS)** to ensure strict user data isolation.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using Next.js, Supabase & Google Gemini
</p>
