import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const faqs = [
  {
    question: 'What is OpenNext Shop?',
    answer: 'OpenNext Shop is a demonstration eCommerce application built with Next.js and Cloudflare Workers. It showcases modern web development practices including multi-worker architecture, edge computing, and incremental static regeneration.',
  },
  {
    question: 'How does the multi-worker architecture work?',
    answer: 'The application is split across multiple specialized workers: a Middleware Worker for routing, an API Worker for backend services, an SSR Worker for dynamic pages, and an SSG Worker for static content. These workers communicate via Cloudflare Service Bindings.',
  },
  {
    question: 'What technologies are used?',
    answer: 'We use Next.js 14 with the App Router, OpenNext Cloudflare adapter, TypeScript, pnpm monorepo with Turborepo, and Cloudflare Workers with R2 storage.',
  },
  {
    question: 'Is this a real store?',
    answer: 'No, this is a demonstration application. All products are fictional and no real transactions are processed. The checkout process simulates an order but does not charge any payment methods.',
  },
  {
    question: 'How is the cart data stored?',
    answer: 'Cart data is stored in memory on the API Worker for this demo. In a production environment, you would use a persistent storage solution like Cloudflare KV or Durable Objects.',
  },
  {
    question: 'Can I deploy this myself?',
    answer: 'Yes! The project is open source and includes deployment scripts. You will need a Cloudflare account and the Wrangler CLI configured to deploy the workers.',
  },
  {
    question: 'What is Incremental Static Regeneration (ISR)?',
    answer: 'ISR allows pages to be updated in the background after the site is built. In this application, blog posts use ISR to ensure content stays fresh without requiring a full rebuild.',
  },
  {
    question: 'How does deployment work?',
    answer: 'We use gradual deployment with version affinity. New versions of workers are deployed incrementally, and the middleware routes requests to compatible worker versions using Cloudflare\'s version affinity headers.',
  },
];

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
          <h1 className="page-title">Frequently Asked Questions</h1>
          <p className="page-subtitle">
            Find answers to common questions about OpenNext Shop.
          </p>

          <div className="card" style={{ marginTop: '2rem' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
