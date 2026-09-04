'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export default function WeddingGallery() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <figure className="gallery-feature">
        <Button
          variant="ghost"
          className="gallery-artwork"
          onClick={() => setOpen(true)}
          aria-label="View the full wedding invitation"
        >
          <Image
            src="/invitation.png"
            width={1142}
            height={1600}
            unoptimized
            alt="Wedding invitation in emerald green, blush pink, and mint green"
          />
          <span className="gallery-enlarge">
            <Maximize2 size={16} /> View invitation
          </span>
        </Button>
        <figcaption>
          <span className="wedding-kicker">01 / THE INVITATION</span>
          <h2>
            It begins with
            <br />
            <em>an invitation.</em>
          </h2>
          <p>
            The colours, the details, and the date. A first look at the
            celebration to come.
          </p>
          <span className="gallery-date">18.12.2026</span>
        </figcaption>
      </figure>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gallery-dialog">
          <DialogHeader>
            <DialogTitle>Our wedding invitation</DialogTitle>
            <DialogDescription>
              Princess & Chijioke · 18 December 2026
            </DialogDescription>
          </DialogHeader>
          <div className="gallery-lightbox-image">
            <Image
              src="/invitation.png"
              width={1142}
              height={1600}
              unoptimized
              alt="Full invitation with wedding ceremony and reception details"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
