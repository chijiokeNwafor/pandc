import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
const links = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/gifts', label: 'Gifts' },
];
export default function WeddingFrame({
  active,
  children,
}: {
  active: '/' | '/gallery' | '/gifts';
  children: React.ReactNode;
}) {
  return (
    <div className="wedding-site">
      <a className="skip-link" href="#wedding-content">
        Skip to content
      </a>
      <header className="wedding-nav">
        <Link
          href="/"
          className="wedding-wordmark"
          aria-label="Princess and Chijioke, home"
        >
          P<span>&</span>C
        </Link>
        <nav aria-label="Wedding navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={active === link.href ? 'nav-current' : ''}
              aria-current={active === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/organizer" className="organizer-link">
          Organizer <ArrowUpRight size={14} />
        </Link>
      </header>
      <main id="wedding-content">{children}</main>
      <footer className="wedding-footer">
        <Link href="/" className="footer-couple">
          Princess <em>&</em> Chijioke
        </Link>
        <span>18 DECEMBER 2026 · LAGOS</span>
        <p>With love, always.</p>
      </footer>
    </div>
  );
}
