import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="pass-page">
      <section className="pass-card">
        <div className="pass-state">
          <h1>Page not found</h1>
          <p>Check your invitation link or return to the studio.</p>
          <Link className="signin-button" href="/">
            Invitation studio
          </Link>
        </div>
      </section>
    </main>
  );
}
