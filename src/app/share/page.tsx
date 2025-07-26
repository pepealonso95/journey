import { Metadata } from 'next';
import { parseShareUrl } from '@/lib/share-url';
import { getBookById } from '@/lib/google-books';
import SharePageClient from './SharePageClient';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

interface SharePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  try {
    // Await searchParams for Next.js 15
    const params = await searchParams;
    
    // Convert searchParams to URLSearchParams
    const urlSearchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlSearchParams.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    const parseResult = parseShareUrl(urlSearchParams);
    
    if (!parseResult) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
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

    const { bookIds, title } = parseResult;
    const listTitle = title || 'Reading List';

    // Fetch first book for description
    let description = `Check out this curated reading list: ${listTitle}`;
    try {
      const bookTitles = await Promise.all(
        bookIds.slice(0, 2).map(async (id) => {
          try {
            const book = await getBookById(id);
            return book?.volumeInfo.title;
          } catch {
            return null;
          }
        })
      );
      const validTitles = bookTitles.filter(Boolean);
      if (validTitles.length > 0) {
        description = `${listTitle} featuring ${validTitles.join(', ')}${bookIds.length > 2 ? ` and ${bookIds.length - 2} more books` : ''}`;
      }
    } catch {
      // Use default description
    }

    // Build OG image URL with query params
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const ogImageUrl = new URL('/api/og', baseUrl);
    ogImageUrl.searchParams.set('books', bookIds.join(','));
    ogImageUrl.searchParams.set('title', listTitle);

    return {
      title: `${listTitle} - Journey`,
      description,
      openGraph: {
        title: `${listTitle} - Journey`,
        description,
        type: 'website',
        url: `${baseUrl}/share?${urlSearchParams.toString()}`,
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
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
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

export default function SharePage() {
  return <SharePageClient />;
}