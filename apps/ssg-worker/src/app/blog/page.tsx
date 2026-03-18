import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getAllBlogPosts } from '@/lib/blog-data';

export const revalidate = 300; // Revalidate every 5 minutes

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <Header />
      <main className="container">
        <div style={{ padding: '2rem 0' }}>
          <h1 className="page-title">Blog</h1>
          <p className="page-subtitle">
            Latest news, tutorials, and insights from the OpenNext team.
          </p>
        </div>

        <div className="blog-grid" style={{ marginBottom: '3rem' }}>
          {posts.map((post) => (
            <article key={post.slug} className="card blog-card">
              <div className="blog-image">{post.title}</div>
              <div className="blog-content">
                <div className="blog-date">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <h2 className="blog-title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-meta">
                  <span>By {post.author}</span>
                  <span>{post.readTime}</span>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        marginRight: '0.5rem',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
