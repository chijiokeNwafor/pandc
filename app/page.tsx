import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Church, MapPin } from 'lucide-react';
import WeddingFrame from '@/components/wedding-frame';
export const metadata = { title: 'Princess & Chijioke | Our Wedding' };
export default function Home() {
  return (
    <WeddingFrame active="/">
      <section className="wedding-hero">
        <div className="hero-copy">
          <p className="wedding-kicker">TOGETHER WITH OUR FAMILIES</p>
          <h1>
            Princess
            <br />
            <span className="hero-ampersand">&</span> Chijioke
          </h1>
          <p className="hero-invite">
            We’re getting married.
            <br />
            And we’d love to celebrate with you.
          </p>
          <div className="hero-date">
            <span>FRIDAY</span>
            <strong>18 December 2026</strong>
            <span>LAGOS, NIGERIA</span>
          </div>
          <a className="wedding-button" href="#the-day">
            The wedding day <ArrowDown size={16} />
          </a>
        </div>
        <div className="hero-art">
          <span className="art-corner-label">THE INVITATION</span>
          <Image
            src="/invitation.png"
            width={1142}
            height={1600}
            alt="Princess and Chijioke’s wedding invitation"
            unoptimized
            priority
          />
          <span className="art-caption">
            A day for love. A lifetime together.
          </span>
        </div>
      </section>
      <section className="wedding-day" id="the-day">
        <div className="day-intro">
          <p className="wedding-kicker">SAVE THE DATE</p>
          <h2>
            One beautiful day.
            <br />
            <em>A new beginning.</em>
          </h2>
          <p>Join our families for the ceremony and reception.</p>
        </div>
        <div className="day-events">
          <article className="event-detail">
            <div className="event-icon">
              <Church size={24} strokeWidth={1.4} />
            </div>
            <div>
              <p className="wedding-kicker">THE CEREMONY · 10 AM</p>
              <h3>RCCG Cornerstone</h3>
              <p className="venue-subtitle">My Father’s House</p>
              <p>Okota, Lagos</p>
            </div>
          </article>
          <article className="event-detail">
            <div className="event-icon">
              <MapPin size={24} strokeWidth={1.4} />
            </div>
            <div>
              <p className="wedding-kicker">THE RECEPTION</p>
              <h3>Hillcrest Event</h3>
              <p>
                46 Ago Palace Way, Okota,
                <br />
                Isolo, Lagos, Nigeria
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="wedding-colours">
        <p className="wedding-kicker">COLOURS OF THE DAY</p>
        <div>
          <span>
            <i className="swatch-mint" />
            Mint green
          </span>
          <span>
            <i className="swatch-blush" />
            Blush pink
          </span>
          <span>
            <i className="swatch-emerald" />
            Emerald green
          </span>
        </div>
        <p className="invitation-only">Strictly by invitation</p>
      </section>
      <div className="home-gallery-link">
        <p>A little glimpse of our celebration.</p>
        <Link href="/gallery">
          Visit the gallery <ArrowUpRight size={17} />
        </Link>
      </div>
    </WeddingFrame>
  );
}
