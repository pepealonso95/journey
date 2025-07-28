import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api-server';
import SharePageClient from '../SharePageClient';

// Force dynamic rendering since we use params
export const dynamic = 'force-dynamic';

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  try {
    // Await params for Next.js 15
    const { slug } = await params;
    
    // Fetch the book list from database
    const bookList = await api.bookList.getPublic({ slug });
    
    if (!bookList) {
      return {
        title: 'List Not Found - Journey',
        description: 'The requested book list could not be found.',
      };
    }

    const listTitle = bookList.title;
    const books = bookList.books || [];
    
    // Build description from custom book descriptions or book titles
    let description = `Check out this curated reading list: ${listTitle}`;
    
    // Check if any books have custom descriptions
    const customDescriptions = books
      .filter(book => book.customDescription)
      .map(book => book.customDescription);
    
    if (customDescriptions.length > 0) {
      // Use first custom description as the primary description
      description = `${listTitle}: "${customDescriptions[0]}"`;
      if (books.length > 1) {
        description += ` and ${books.length - 1} more book${books.length > 2 ? 's' : ''}`;
      }
    } else if (books.length > 0) {
      // Fallback to book titles if no custom descriptions
      const bookTitles = books.slice(0, 2).map(book => book.title).filter(Boolean);
      if (bookTitles.length > 0) {
        description = `${listTitle} featuring ${bookTitles.join(', ')}${books.length > 2 ? ` and ${books.length - 2} more books` : ''}`;
      }
    }

    // Build OG image URL with slug
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.readjourney.link';
    const ogImageUrl = new URL('/api/og', baseUrl);
    ogImageUrl.searchParams.set('slug', slug);
    // Fallback to books and title if needed
    ogImageUrl.searchParams.set('books', books.map(book => book.id).join(','));
    ogImageUrl.searchParams.set('title', listTitle);

    return {
      title: `${listTitle} - Journey`,
      description,
      openGraph: {
        title: `${listTitle} - Journey`,
        description,
        type: 'website',
        url: `${baseUrl}/share/${slug}`,
        siteName: 'Journey',
        images: [{
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${listTitle} - A curated reading list on Journey`,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${listTitle} - Journey`,
        description,
        images: [ogImageUrl.toString()],
        creator: '@pepealonsog',
        site: '@pepealonsog',
      },
      // Additional meta tags for broader compatibility
      other: {
        // LinkedIn specific
        'linkedin:owner': 'Journey',
        // WhatsApp/Telegram compatibility
        'article:author': 'Journey',
        'article:section': 'Books',
        // General social media
        'image': ogImageUrl.toString(),
        'image:width': '1200',
        'image:height': '630',
        'image:alt': `${listTitle} - A curated reading list on Journey`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.readjourney.link';
    const defaultImageUrl = `${baseUrl}/api/og`;
    return {
      title: 'Journey - Share Your Reading Journey',
      description: 'Discover and share curated book lists with Journey',
      openGraph: {
        title: 'Journey - Share Your Reading Journey',
        description: 'Discover and share curated book lists with Journey',
        type: 'website',
        url: `${baseUrl}/share`,
        siteName: 'Journey',
        images: [{
          url: defaultImageUrl,
          width: 1200,
          height: 630,
          alt: 'Journey - Share Your Reading Journey',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Journey - Share Your Reading Journey',
        description: 'Discover and share curated book lists with Journey',
        images: [defaultImageUrl],
        creator: '@pepealonsog',
        site: '@pepealonsog',
      },
      other: {
        'linkedin:owner': 'Journey',
        'article:author': 'Journey',
        'article:section': 'Books',
        'image': defaultImageUrl,
        'image:width': '1200',
        'image:height': '630',
        'image:alt': 'Journey - Share Your Reading Journey',
      },
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  
  // Pass the slug to the client component
  return <SharePageClient slug={slug} />;
}