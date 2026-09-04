import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="pass-page">
      <section className="pass-card">
        <div className="pass-state">
          <h1>Page not found</h1>
          <p>Check your invitation link or return to the wedding website.</p>
          <Link className="signin-button" href="/">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
