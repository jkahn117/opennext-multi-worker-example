import Link from 'next/link';

export function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <Link href="/" className="logo">
          OpenNext Shop
        </Link>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
      </div>
    </header>
  );
}
