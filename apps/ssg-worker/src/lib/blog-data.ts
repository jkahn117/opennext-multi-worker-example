export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-opennext',
    title: 'Getting Started with OpenNext',
    excerpt: 'Learn how to build and deploy Next.js applications on Cloudflare Workers using OpenNext.',
    content: `
      <p>OpenNext is a powerful tool that enables you to deploy Next.js applications on Cloudflare Workers. In this guide, we'll walk through the basics of setting up your first OpenNext project.</p>
      
      <h2>What is OpenNext?</h2>
      <p>OpenNext is an open-source project that provides an adapter for deploying Next.js applications on various platforms, including Cloudflare Workers. It handles the complexity of converting Next.js applications to work in a serverless environment.</p>
      
      <h2>Setting Up Your Project</h2>
      <p>To get started, you'll need to install the OpenNext Cloudflare adapter:</p>
      <pre><code>npm install @opennextjs/cloudflare</code></pre>
      
      <h2>Configuration</h2>
      <p>Create an open-next.config.ts file in your project root to configure how your application should be built and deployed.</p>
      
      <h2>Deploying</h2>
      <p>Once configured, you can build and deploy your application using Wrangler.</p>
    `,
    author: 'Jane Developer',
    date: '2024-03-15',
    tags: ['opennext', 'cloudflare', 'nextjs'],
    readTime: '5 min read',
  },
  {
    slug: 'multi-worker-architecture',
    title: 'Multi-Worker Architecture Benefits',
    excerpt: 'Understanding the benefits of splitting your application across multiple Cloudflare Workers.',
    content: `
      <p>As your application grows, you may find that a single worker becomes a bottleneck. Multi-worker architecture allows you to split your application into smaller, more manageable pieces.</p>
      
      <h2>Why Multi-Worker?</h2>
      <p>Splitting your application across multiple workers offers several advantages:</p>
      <ul>
        <li>Better performance through parallelization</li>
        <li>Improved maintainability</li>
        <li>Easier scaling</li>
        <li>Reduced cold start times</li>
      </ul>
      
      <h2>Implementation Strategies</h2>
      <p>There are several ways to implement multi-worker architecture. One common approach is to separate API routes from page rendering.</p>
      
      <h2>Best Practices</h2>
      <p>When implementing multi-worker architecture, keep these best practices in mind...</p>
    `,
    author: 'John Architect',
    date: '2024-03-10',
    tags: ['architecture', 'cloudflare', 'workers'],
    readTime: '8 min read',
  },
  {
    slug: 'edge-computing-best-practices',
    title: 'Edge Computing Best Practices',
    excerpt: 'Tips and tricks for building performant edge applications with Cloudflare Workers.',
    content: `
      <p>Edge computing brings your application closer to your users, reducing latency and improving performance. Here are some best practices for building edge applications.</p>
      
      <h2>Minimize Cold Starts</h2>
      <p>Cold starts can impact the user experience. Keep your workers lean and minimize dependencies.</p>
      
      <h2>Use Caching Wisely</h2>
      <p>Cloudflare's cache API allows you to cache responses at the edge. Use it to reduce origin requests.</p>
      
      <h2>Optimize Data Access</h2>
      <p>When accessing data stores, consider the geographic location of your data relative to your users.</p>
    `,
    author: 'Sarah Performance',
    date: '2024-03-05',
    tags: ['performance', 'edge', 'best-practices'],
    readTime: '6 min read',
  },
  {
    slug: 'understanding-isr',
    title: 'Understanding Incremental Static Regeneration',
    excerpt: 'A deep dive into ISR and how it can improve your Next.js application performance.',
    content: `
      <p>Incremental Static Regeneration (ISR) allows you to create or update static pages after you've built your site. This is perfect for content that changes frequently but doesn't need to be real-time.</p>
      
      <h2>How ISR Works</h2>
      <p>When a user requests a page that uses ISR, Next.js serves a cached version of the page. In the background, Next.js regenerates the page with the latest data.</p>
      
      <h2>Configuration</h2>
      <p>To enable ISR, add the revalidate property to your page component.</p>
      
      <h2>Use Cases</h2>
      <p>ISR is perfect for blog posts, product listings, and other content that updates periodically.</p>
    `,
    author: 'Mike Static',
    date: '2024-02-28',
    tags: ['nextjs', 'isr', 'performance'],
    readTime: '7 min read',
  },
  {
    slug: 'r2-storage-guide',
    title: 'Using Cloudflare R2 for Storage',
    excerpt: 'Learn how to use Cloudflare R2 for storing and serving static assets.',
    content: `
      <p>Cloudflare R2 is an S3-compatible object storage service with zero egress fees. It's perfect for storing static assets, backups, and more.</p>
      
      <h2>Getting Started</h2>
      <p>To use R2, you'll need to create a bucket and configure your application to use it.</p>
      
      <h2>Integration with Workers</h2>
      <p>R2 integrates seamlessly with Cloudflare Workers, allowing you to read and write objects directly from your worker code.</p>
      
      <h2>Cost Benefits</h2>
      <p>With zero egress fees, R2 can significantly reduce your storage costs compared to traditional object storage solutions.</p>
    `,
    author: 'Alex Storage',
    date: '2024-02-20',
    tags: ['r2', 'storage', 'cloudflare'],
    readTime: '5 min read',
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
