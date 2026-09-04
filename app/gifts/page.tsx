import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import WeddingFrame from '@/components/wedding-frame';
export const metadata = {
  title: 'Gifts | Princess & Chijioke',
  description: 'A note of thanks from Princess and Chijioke.',
};
export default function Gifts() {
  return (
    <WeddingFrame active="/gifts">
      <section className="gifts-page">
        <div className="gifts-intro">
          <p className="wedding-kicker">WITH GRATEFUL HEARTS</p>
          <h1>
            Your love is
            <br />
            <em>our greatest gift.</em>
          </h1>
        </div>
        <article className="thank-you-note">
          <span className="note-monogram" aria-hidden="true">
            P<span>&</span>C
          </span>
          <div className="note-rule" />
          <h2>Thank you.</h2>
          <p>
            Thank you for celebrating with us. Your love, kindness, and support
            mean so much as we begin married life together.
          </p>
          <p>We’re grateful to share this special day with you.</p>
          <div className="note-signature">
            <span>With love,</span>
            <strong>Princess & Chijioke</strong>
          </div>
        </article>
        <Link className="gifts-return" href="/">
          Back to the wedding details <ArrowUpRight size={16} />
        </Link>
      </section>
    </WeddingFrame>
  );
}
