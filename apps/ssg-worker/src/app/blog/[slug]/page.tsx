import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getBlogPostBySlug, getBlogPostSlugs } from '@/lib/blog-data';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = getBlogPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="container">
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
          <Link href="/blog" className="button button-secondary" style={{ marginBottom: '2rem' }}>
            ← Back to Blog
          </Link>

          <header style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    marginRight: '0.5rem',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="page-title">{post.title}</h1>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              <span>
                By <strong>{post.author}</strong>
              </span>
              <span>•</span>
              <span>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <div
            className="card"
            style={{
              padding: '2rem',
              lineHeight: '1.8',
              fontSize: '1.125rem',
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: '1rem' }}>Share this article</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="button button-secondary">Twitter</button>
              <button className="button button-secondary">LinkedIn</button>
              <button className="button button-secondary">Facebook</button>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
