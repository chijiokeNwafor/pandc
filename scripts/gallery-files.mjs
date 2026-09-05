import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSizeFromFile } from 'image-size/fromFile';

const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

async function imageFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await imageFiles(path.join(directory, entry.name), relative)),
      );
    } else if (
      entry.isFile() &&
      extensions.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(relative);
    }
  }
  return files.sort(
    (a, b) => collator.compare(a, b) || a.localeCompare(b, 'en'),
  );
}

export async function generateGallery(
  root = process.cwd(),
  warn = console.warn,
) {
  const directory = path.join(root, 'public', 'gallery');
  const output = path.join(root, 'lib', 'gallery-images.generated.json');
  await mkdir(directory, { recursive: true });
  const images = [];
  for (const file of await imageFiles(directory)) {
    try {
      const metadata = await imageSizeFromFile(path.join(directory, file));
      let { width, height } = metadata;
      if (!width || !height) throw new Error('Image has no dimensions');
      // Browsers rotate phone photos according to their EXIF orientation.
      if (metadata.orientation >= 5 && metadata.orientation <= 8) {
        [width, height] = [height, width];
      }
      const filename = path.basename(file, path.extname(file));
      const caption = filename
        .replace(/^\d+[-_\s]+/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const title = caption
        ? caption.charAt(0).toUpperCase() + caption.slice(1)
        : 'Wedding photograph';
      images.push({
        id: `gallery/${file}`,
        src: `/gallery/${file.split('/').map(encodeURIComponent).join('/')}`,
        width,
        height,
        title,
        alt: title,
      });
    } catch (error) {
      warn(`[gallery] Skipping ${file}: ${error.message}`);
    }
  }
  const contents = `${JSON.stringify(images, null, 2)}\n`;
  const previous = await readFile(output, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (previous !== contents) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, contents);
  }
  return { images, changed: previous !== contents };
}

export function galleryFilesPlugin(root = process.cwd()) {
  const directory = path.resolve(root, 'public', 'gallery');
  return {
    name: 'wedding-gallery-files',
    configureServer(server) {
      let timer;
      let pending = Promise.resolve();
      const refresh = (_event, file) => {
        if (file !== directory && !file.startsWith(`${directory}${path.sep}`))
          return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = pending
            .then(() =>
              generateGallery(root, (message) =>
                server.config.logger.warn(message),
              ),
            )
            .then(({ changed }) => {
              if (changed) server.ws.send({ type: 'full-reload' });
            })
            .catch((error) =>
              server.config.logger.error(`[gallery] ${error.message}`),
            );
        }, 150);
      };
      server.watcher.add(directory);
      server.watcher.on('all', refresh);
      server.httpServer?.once('close', () => {
        clearTimeout(timer);
        server.watcher.off('all', refresh);
      });
    },
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { images } = await generateGallery();
  console.log(
    `[gallery] Found ${images.length} image${images.length === 1 ? '' : 's'} in public/gallery/`,
  );
}
