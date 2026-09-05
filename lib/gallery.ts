import folderImages from './gallery-images.generated.json';

export type GalleryImage = {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  alt: string;
  description?: string;
};

export const galleryImages: GalleryImage[] = [
  {
    id: 'invitation',
    src: '/invitation.png',
    width: 1142,
    height: 1600,
    title: 'Our wedding invitation',
    alt: 'Princess and Chijioke’s wedding invitation in emerald green, blush pink, and mint green',
    description:
      'The colours, the details, and the date. A first look at the celebration to come.',
  },
  ...folderImages,
];
