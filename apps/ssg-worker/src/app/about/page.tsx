import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
          <h1 className="page-title">About OpenNext Shop</h1>
          
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              OpenNext Shop is a demonstration eCommerce application built to showcase the power 
              of modern web development technologies. It serves as a reference implementation 
              for building scalable, performant online stores using Next.js and Cloudflare Workers.
            </p>
            <p>
              This project demonstrates multi-worker architecture, where different aspects of 
              the application are handled by specialized workers optimized for their specific tasks.
            </p>
          </section>

          <section className="about-section">
            <h2>Technology Stack</h2>
            <ul style={{ marginLeft: '1.5rem', color: '#666' }}>
              <li>Next.js 14 with App Router</li>
              <li>OpenNext Cloudflare Adapter</li>
              <li>Cloudflare Workers (Edge Runtime)</li>
              <li>R2 Object Storage</li>
              <li>Service Bindings for inter-worker communication</li>
              <li>TypeScript with strict mode</li>
              <li>pnpm monorepo with Turborepo</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Architecture</h2>
            <p>
              Our application uses a distributed architecture with multiple workers:
            </p>
            <ul style={{ marginLeft: '1.5rem', color: '#666' }}>
              <li>
                <strong>Middleware Worker:</strong> Entry point that routes requests to appropriate workers
              </li>
              <li>
                <strong>API Worker:</strong> Handles all API endpoints (products, cart, checkout)
              </li>
              <li>
                <strong>SSR Worker:</strong> Renders dynamic pages server-side
              </li>
              <li>
                <strong>SSG Worker:</strong> Serves static and ISR pages
              </li>
              <li>
                <strong>Deployment Manager:</strong> Coordinates deployments across all workers
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Features</h2>
            <ul style={{ marginLeft: '1.5rem', color: '#666' }}>
              <li>Product catalog with search and filtering</li>
              <li>Shopping cart with persistent storage</li>
              <li>Checkout process with address validation</li>
              <li>Blog with Incremental Static Regeneration (ISR)</li>
              <li>Responsive design for all devices</li>
              <li>Zero-downtime deployments with gradual rollout</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Open Source</h2>
            <p>
              This project is open source and available on GitHub. We welcome contributions 
              from the community. Whether you want to report a bug, suggest a feature, or 
              submit a pull request, we would love to hear from you.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
