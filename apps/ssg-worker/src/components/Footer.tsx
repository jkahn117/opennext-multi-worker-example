import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <h3>Shop</h3>
          <Link href="/">Home</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About Us</Link>
          <Link href="/faq">FAQ</Link>
        </div>
        <div className="footer-section">
          <h3>Customer Service</h3>
          <Link href="/faq">Help Center</Link>
          <Link href="/faq">Shipping Info</Link>
          <Link href="/faq">Returns</Link>
          <Link href="/faq">Contact Us</Link>
        </div>
        <div className="footer-section">
          <h3>About</h3>
          <p style={{ color: '#999', fontSize: '0.875rem' }}>
            OpenNext Shop is a demo eCommerce application built with OpenNext and Cloudflare Workers.
          </p>
        </div>
      </div>
    </footer>
  );
}
