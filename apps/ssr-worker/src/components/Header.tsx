import Link from 'next/link';

interface HeaderProps {
  cartItemCount?: number;
}

export function Header({ cartItemCount = 0 }: HeaderProps) {
  return (
    <header className="header">
      <div className="container header-content">
        <Link href="/" className="logo">
          OpenNext Shop
        </Link>
        <nav className="nav">
          <Link href="/products">Products</Link>
          <Link href="/cart">
            Cart{cartItemCount > 0 && ` (${cartItemCount})`}
          </Link>
          <Link href="/account">Account</Link>
        </nav>
      </div>
    </header>
  );
}
