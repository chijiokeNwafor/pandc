# Adding gallery photos

Put your images in **`public/gallery/`**. The gallery finds them automatically; there is no image list to edit and no upload service or R2 storage.

```text
public/gallery/
  01-our-engagement.jpg
  02-family-and-friends.png
  03-the-celebration.webp
```

- Supported formats: JPG, JPEG, PNG, WebP, GIF, and AVIF. Convert HEIC photos to JPG first.
- Subfolders are supported. Hidden files, hidden folders, and symbolic links are ignored.
- Images appear in filename order, with numeric sorting. Use prefixes such as `01-`, `02-`, and `03-` to choose an order. The original invitation stays first.
- Captions come from filenames: `01-our-engagement.jpg` becomes **Our engagement**. Dashes and underscores become spaces, and the ordering prefix is hidden.
- Each image opens in an enlarged viewer with Previous/Next controls and arrow-key navigation.
- Remove a photo from this folder to remove it from the gallery. Rename it to change its caption or order.
- Photos retain their original bytes and dimensions. Resize very large photos before adding them to keep the gallery quick to load.

Run `npm run dev` for the local preview. After adding, changing, or removing photos, run `npm run gallery:refresh` or restart the dev server. A production build (`npm run build`) also discovers the folder from scratch. **Deploy a new Vercel version to put your new photos on the live website.** Copying files into the local folder alone does not change the published site.

`lib/gallery-images.generated.json` is generated automatically; do not maintain it by hand. `npm run gallery:refresh` can refresh it without starting the website. Keep this generated file with your source when committing changes.

All files in `public/` are public website assets. Only place photos there that you want guests to be able to see.
