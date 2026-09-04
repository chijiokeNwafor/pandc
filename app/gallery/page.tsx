import WeddingFrame from '@/components/wedding-frame';
import WeddingGallery from '@/components/wedding-gallery';
export const metadata = {
  title: 'Gallery | Princess & Chijioke',
  description: 'A first look at Princess and Chijioke’s wedding celebration.',
};
export default function Gallery() {
  return (
    <WeddingFrame active="/gallery">
      <section className="wedding-page-intro">
        <p className="wedding-kicker">OUR GALLERY</p>
        <h1>
          Moments
          <br />
          <em>to treasure.</em>
        </h1>
        <p>The beginning of our wedding album.</p>
      </section>
      <WeddingGallery />
    </WeddingFrame>
  );
}
