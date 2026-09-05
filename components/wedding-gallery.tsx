'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Maximize2, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import type { GalleryImage } from '@/lib/gallery';
export default function WeddingGallery({ images }: { images: GalleryImage[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const index = images.findIndex((image) => image.id === selectedId);
  const selected = index >= 0 ? images[index] : null;
  function move(direction: number) {
    const next = images[index + direction];
    if (next) setSelectedId(next.id);
  }
  return (
    <section className="gallery-collection" aria-label="Wedding images">
      <div className="gallery-collection-heading">
        <span className="wedding-kicker">OUR ALBUM</span>
        <span>
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
      </div>
      {images.length ? (
        <div
          className={`gallery-grid ${images.length === 1 ? 'gallery-grid-single' : ''}`}
        >
          {images.map((image) => (
            <figure className="gallery-tile" key={image.id}>
              <Button
                variant="ghost"
                className="gallery-tile-media"
                onClick={() => setSelectedId(image.id)}
                aria-label={`Enlarge ${image.title}`}
              >
                <Image
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  unoptimized
                  alt={image.alt}
                />
                <span className="gallery-enlarge">
                  <Maximize2 size={16} /> View image
                </span>
              </Button>
              <figcaption>
                <h2>{image.title}</h2>
                {image.description && <p>{image.description}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <Empty className="gallery-empty">
          <EmptyHeader>
            <Images size={30} />
            <EmptyTitle>The album is ready for its first photograph</EmptyTitle>
            <EmptyDescription>
              Images added to the gallery will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          className="gallery-dialog"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              move(1);
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.description ||
                    'Princess & Chijioke · Our wedding gallery'}
                </DialogDescription>
              </DialogHeader>
              <div className="gallery-lightbox-image">
                <Image
                  src={selected.src}
                  width={selected.width}
                  height={selected.height}
                  unoptimized
                  alt={selected.alt}
                />
              </div>
              {images.length > 1 && (
                <div className="gallery-browse">
                  <Button
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => move(-1)}
                    aria-label="Previous image"
                  >
                    <ArrowLeft size={16} /> Previous
                  </Button>
                  <span aria-live="polite">
                    {index + 1} of {images.length}
                  </span>
                  <Button
                    variant="outline"
                    disabled={index === images.length - 1}
                    onClick={() => move(1)}
                    aria-label="Next image"
                  >
                    Next <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
