# Journey 📚

**Share Your Reading Journey**

Journey is a modern web application that allows users to create, curate, and share beautiful reading lists of exactly 4 books on any topic. Whether you're building a machine learning curriculum or sharing must-reads before an MBA, Journey makes it easy to create focused, ordered book recommendations.

## 🤖 Development Notes

This project was built over a weekend using Claude Code, mostly as an experiment to see what could be accomplished quickly with AI assistance. Started Friday evening with just the idea of making book sharing easier, and by Sunday had a working platform with user auth, social features, and all the polish.

It's been a good test case for rapid prototyping - the kind of project that might normally take weeks ended up being a weekend hack. Everything from database design to the drag-and-drop interface to OpenGraph image generation was built through conversation rather than traditional coding.

*Created by [@pepealonsog](https://twitter.com/pepealonsog)*

## 🎯 Purpose

Journey addresses the common problem of book recommendation overload. Instead of endless, overwhelming lists, Journey enforces a constraint of exactly 4 books per list, encouraging curators to be thoughtful and selective. The app emphasizes reading order through an intuitive comparison-based interface, helping readers understand the optimal sequence for their learning journey.

## ✨ Complete Feature Set

### 📚 List Creation & Management
- **Curated Lists**: Create focused lists of exactly 4 books with optimal reading order
- **Custom Descriptions**: Add personal context explaining why each book matters in your sequence
- **Anonymous Sharing**: Share lists instantly via URL without requiring authentication
- **Gamified Ordering**: Intuitive "which should be read first?" comparison interface
- **Drag & Drop**: Reorder books with smooth drag-and-drop interactions
- **Google Books Integration**: Search and select from millions of books with rich metadata

### 👤 User Profiles & Authentication
- **Twitter Integration**: Sign in with Twitter/X to build your reading profile
- **Personal Profile Pages**: Your lists live at `/profile/yourhandle` for easy sharing
- **List Management**: Save, organize, and delete your book lists
- **Copy & Personalize**: Save others' lists to your profile with your own modifications
- **Profile Sharing**: Custom OpenGraph previews for profile-based lists

### 🌐 Social Features & Discovery
- **Beautiful Previews**: Rich social media previews with book covers for Twitter, LinkedIn, WhatsApp
- **Like System**: Show appreciation for great book recommendations
- **Popular Lists**: Discover trending lists from the community organized by timeframe
- **Social Discovery**: Find your next great read from curated community recommendations

### 🎨 User Experience
- **Mobile Responsive**: Optimized experience across all devices with adaptive layouts
- **Rich Previews**: Custom OpenGraph images showing book covers and reading sequence
- **Clean URLs**: SEO-friendly URLs with proper slug generation
- **Accessibility**: Built with semantic HTML and proper ARIA labels
- **Performance**: Edge-optimized with caching and efficient database queries

## 🛠 Technology Stack

Built with modern, production-ready technologies:

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components, Lucide icons
- **State Management**: tRPC for type-safe API calls
- **Authentication**: NextAuth.js with Twitter/X OAuth provider
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Book Data**: Google Books API with intelligent caching
- **Image Generation**: Vercel/OG for dynamic OpenGraph previews
- **Deployment**: Vercel with GitHub Actions CI/CD
- **Runtime**: Edge Runtime for optimal performance

## 🏗 Architecture

```
src/
├── app/                         # Next.js App Router pages
│   ├── create/                 # List creation with book search & comparison
│   ├── share/[slug]/           # Public anonymous list viewing
│   ├── profile/[handle]/       # User profile pages
│   │   └── [slug]/            # Individual profile list pages
│   ├── popular/               # Popular lists discovery
│   ├── api/                   # API routes
│   │   ├── og/               # Dynamic OpenGraph image generation
│   │   └── cleanup-slugs/    # Background cleanup tasks
│   └── page.tsx              # Landing page with full feature showcase
├── components/                # Reusable UI components
│   ├── book/                 # Book-related components (search, display, comparison)
│   ├── ui/                   # shadcn/ui base components
│   └── layout/               # Header, navigation, and layout components
├── lib/                      # Core utilities and services
│   ├── google-books.ts       # Google Books API integration
│   ├── book-cache.ts         # Intelligent book data caching
│   ├── share-url.ts          # URL encoding/decoding for anonymous lists
│   ├── db-edge.ts            # Edge-compatible database queries
│   └── auth.ts               # NextAuth configuration
├── server/                   # Server-side code
│   ├── api/                  # tRPC routers
│   │   ├── routers/
│   │   │   ├── bookList.ts   # List CRUD operations
│   │   │   ├── book.ts       # Book search and caching
│   │   │   ├── user.ts       # User profile management
│   │   │   └── like.ts       # Like system functionality
│   │   └── root.ts           # API router configuration
│   └── db/                   # Database schema and migrations
│       ├── schema.ts         # Drizzle schema definitions
│       └── auth-schema.ts    # Authentication tables
└── scripts/                  # Utility scripts
    ├── cleanup-cache.ts      # Book cache maintenance
    └── cleanup-expired-lists.ts # Anonymous list cleanup
```

### Core Concepts

- **Dual Mode Architecture**: Works both with and without authentication
  - Anonymous lists: Encoded in URL parameters, stored in database with expiration
  - Profile lists: Persistent storage with user association
- **Comparison-based Ordering**: Tournament-style comparisons to determine optimal reading sequence
- **Edge-First**: Optimized for Vercel Edge Runtime with intelligent caching
- **Type-Safe**: End-to-end TypeScript with tRPC for API calls
- **Social-First**: Rich OpenGraph previews and shareable URLs for all platforms

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

## 📱 How It Works

### Anonymous List Creation (No Sign-in Required)
1. **Search & Select**: Find 4 books using Google Books search
2. **Order with Comparisons**: Use the "which should be read first?" interface to determine optimal sequence
3. **Add Custom Context**: Explain why each book matters in your reading journey
4. **Share Instantly**: Get a shareable URL with rich previews for social media

### Profile-Based Lists (Twitter Sign-in)
1. **Sign in with Twitter**: Authenticate to build your reading profile
2. **Create Owned Lists**: Build lists that live at `/profile/yourhandle/list-slug`
3. **Manage Your Collection**: Save, edit, and organize all your book lists
4. **Social Discovery**: Like others' lists and discover trending recommendations
5. **Copy & Customize**: Save community lists to your profile with personal modifications

### Sharing & Discovery
- **Rich Previews**: All lists generate beautiful OpenGraph images showing book covers
- **Popular Lists**: Discover trending lists by week, month, or all-time
- **Social Integration**: Perfect previews for Twitter, LinkedIn, WhatsApp, and more
- **Profile Pages**: Your personal reading hub at `/profile/{handle}`

## 👨‍💻 Author

Built by [@pepealonsog](https://twitter.com/pepealonsog) over a weekend as an experiment in AI-assisted development.

## 🤝 Contributing

Contributions are welcome! This project is a good example for anyone interested in modern Next.js patterns, full-stack TypeScript, or social sharing optimization.

Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is open source and available under the MIT License.

## 🔮 Future Ideas

- List collections and categories
- Reading progress tracking  
- Enhanced community features and discovery
- Book availability checking across platforms
- Integration with reading apps and services
- AI-powered book recommendations based on existing lists

---

*Journey: Because the best reading lists are focused, ordered, and shareable.*