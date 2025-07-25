# Journey 📚

**Share Your Reading Journey**

Journey is a modern web application that allows users to create, curate, and share beautiful reading lists of exactly 4 books on any topic. Whether you're building a machine learning curriculum or sharing must-reads before an MBA, Journey makes it easy to create focused, ordered book recommendations.

## 🎯 Purpose

Journey addresses the common problem of book recommendation overload. Instead of endless, overwhelming lists, Journey enforces a constraint of exactly 4 books per list, encouraging curators to be thoughtful and selective. The app emphasizes reading order through an intuitive comparison-based interface, helping readers understand the optimal sequence for their learning journey.

## ✨ Key Features

- **Curated Lists**: Create focused lists of exactly 4 books with optimal reading order
- **Anonymous Sharing**: Share lists instantly via URL without requiring authentication
- **Gamified Ordering**: Intuitive "which should be read first?" comparison interface
- **Beautiful Previews**: Share lists with rich book covers and clean descriptions
- **Optional Authentication**: Save and manage lists with Twitter/X sign-in
- **Mobile Responsive**: Optimized experience across all devices

## 🛠 Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: NextAuth.js with Twitter/X provider
- **Database**: PostgreSQL with Drizzle ORM
- **Book Data**: Google Books API
- **Deployment**: Vercel (recommended)

## 🏗 Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── create/            # List creation with book search & comparison
│   ├── share/             # Public list viewing
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
├── lib/                   # Core utilities and services
│   ├── google-books.ts    # Google Books API integration
│   ├── share-url.ts       # URL encoding/decoding for anonymous lists
│   └── db/                # Database schema and configuration
└── types/                 # TypeScript type definitions
```

### Core Concepts

- **Anonymous Lists**: Encoded in URL parameters, no database storage required
- **Comparison-based Ordering**: Uses tournament-style comparisons to determine reading sequence
- **Dual Mode**: Works both with and without authentication
- **API-First**: Clean separation between data fetching and UI components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Google Books API key
- Twitter/X OAuth app (optional, for authentication)

### Environment Setup

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://..."

# Google Books API
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY="your_api_key"

# Authentication (optional)
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"
TWITTER_CLIENT_ID="your_client_id"
TWITTER_CLIENT_SECRET="your_client_secret"
```

### Installation

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:generate
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage

1. **Create a List**: Search for books and use the comparison interface to order them
2. **Add a Title**: Give your list a descriptive name (optional)
3. **Share**: Copy the generated URL to share your list anywhere
4. **Save**: Sign in with Twitter/X to save lists to your account (optional)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 👨‍💻 Author

Built by [@pepealonsog](https://x.com/pepealonsog)

## 📄 License

This project is open source and available under the MIT License.

## 🔮 Future Ideas

- List collections and categories
- Reading progress tracking
- Community features and discovery
- Book availability checking across platforms

---

*Journey: Because the best reading lists are focused, ordered, and shareable.*