import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      
      <section className="hero">
        <div className="container">
          <h1>Welcome to OpenNext Shop</h1>
          <p>Built with OpenNext and Cloudflare Workers</p>
          <Link href="/products" className="button button-large button-secondary">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="feature-grid">
            <div className="card feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Built on Cloudflare&apos;s edge network for blazing fast performance worldwide.
              </p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure by Default</h3>
              <p className="feature-description">
                Enterprise-grade security with automatic SSL and DDoS protection.
              </p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Always Available</h3>
              <p className="feature-description">
                Multi-worker architecture ensures your store is always online.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <h2 className="section-title">Featured Categories</h2>
          <div className="feature-grid">
            <div className="card feature-card">
              <h3 className="feature-title">Electronics</h3>
              <p className="feature-description">
                Latest gadgets and devices for tech enthusiasts.
              </p>
              <Link href="/products?category=electronics" className="button" style={{ marginTop: '1rem' }}>
                Browse Electronics
              </Link>
            </div>
            <div className="card feature-card">
              <h3 className="feature-title">Clothing</h3>
              <p className="feature-description">
                Fashion for everyone with sustainable materials.
              </p>
              <Link href="/products?category=clothing" className="button" style={{ marginTop: '1rem' }}>
                Browse Clothing
              </Link>
            </div>
            <div className="card feature-card">
              <h3 className="feature-title">Home & Garden</h3>
              <p className="feature-description">
                Everything you need to make your house a home.
              </p>
              <Link href="/products?category=home" className="button" style={{ marginTop: '1rem' }}>
                Browse Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">From Our Blog</h2>
          <div className="blog-grid">
            <article className="card blog-card">
              <div className="blog-image">Blog Image</div>
              <div className="blog-content">
                <div className="blog-date">March 15, 2024</div>
                <h3 className="blog-title">Getting Started with OpenNext</h3>
                <p className="blog-excerpt">
                  Learn how to build and deploy Next.js applications on Cloudflare Workers.
                </p>
                <Link href="/blog/getting-started-with-opennext" className="button button-secondary">
                  Read More
                </Link>
              </div>
            </article>
            <article className="card blog-card">
              <div className="blog-image">Blog Image</div>
              <div className="blog-content">
                <div className="blog-date">March 10, 2024</div>
                <h3 className="blog-title">Multi-Worker Architecture</h3>
                <p className="blog-excerpt">
                  Understanding the benefits of splitting your application across multiple workers.
                </p>
                <Link href="/blog/multi-worker-architecture" className="button button-secondary">
                  Read More
                </Link>
              </div>
            </article>
            <article className="card blog-card">
              <div className="blog-image">Blog Image</div>
              <div className="blog-content">
                <div className="blog-date">March 5, 2024</div>
                <h3 className="blog-title">Edge Computing Best Practices</h3>
                <p className="blog-excerpt">
                  Tips and tricks for building performant edge applications.
                </p>
                <Link href="/blog/edge-computing-best-practices" className="button button-secondary">
                  Read More
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
