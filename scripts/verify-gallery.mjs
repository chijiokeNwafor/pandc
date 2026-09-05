import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { generateGallery } from './gallery-files.mjs';

await test('gallery discovers files, keeps usable URLs and dimensions, and tracks renames/removals', async () => {
  await mkdir('work', { recursive: true });
  const root = await mkdtemp(path.resolve('work', 'gallery-test-'));
  const directory = path.join(root, 'public', 'gallery');
  try {
    assert.deepEqual((await generateGallery(root)).images, []);
    await mkdir(path.join(directory, 'family'), { recursive: true });
    await mkdir(path.join(directory, '.private'), { recursive: true });
    const portrait = createCanvas(40, 60).toBuffer('image/png');
    const landscape = createCanvas(80, 50).toBuffer('image/png');
    await Promise.all([
      writeFile(path.join(directory, '02-our-engagement.PNG'), portrait),
      writeFile(path.join(directory, '10-friends & family.png'), landscape),
      writeFile(
        path.join(directory, 'family', '01-Joy in Lagos #1.png'),
        landscape,
      ),
      writeFile(path.join(directory, '.hidden.png'), portrait),
      writeFile(path.join(directory, '.private', 'portrait.png'), portrait),
      writeFile(path.join(directory, 'notes.txt'), 'not a photo'),
      writeFile(path.join(directory, 'broken.png'), 'not a valid PNG'),
      symlink(
        path.join(directory, '02-our-engagement.PNG'),
        path.join(directory, 'linked.png'),
      ),
    ]);
    const warnings = [];
    const { images, changed } = await generateGallery(root, (message) =>
      warnings.push(message),
    );
    assert.equal(changed, true);
    assert.equal(images.length, 3);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /broken.png/);
    assert.deepEqual(
      images.map(({ title }) => title),
      ['Our engagement', 'Friends & family', 'Joy in Lagos #1'],
    );
    assert.deepEqual(
      images.map(({ width, height }) => [width, height]),
      [
        [40, 60],
        [80, 50],
        [80, 50],
      ],
    );
    for (const image of images) {
      const localFile = path.join(
        root,
        'public',
        decodeURIComponent(image.src),
      );
      assert.ok((await stat(localFile)).isFile());
      assert.equal(new URL(image.src, 'https://example.com').hash, '');
    }
    assert.equal(new Set(images.map(({ id }) => id)).size, 3);
    const manifest = path.join(root, 'lib', 'gallery-images.generated.json');
    assert.deepEqual(JSON.parse(await readFile(manifest, 'utf8')), images);
    assert.equal((await generateGallery(root, () => {})).changed, false);

    await rename(
      path.join(directory, '02-our-engagement.PNG'),
      path.join(directory, '01-a-new-caption.PNG'),
    );
    await rm(path.join(directory, '10-friends & family.png'));
    const updated = await generateGallery(root, () => {});
    assert.equal(updated.images.length, 2);
    assert.equal(updated.images[0].title, 'A new caption');
    assert.ok(
      updated.images.every(
        ({ src }) =>
          !src.includes('our-engagement') && !src.includes('friends'),
      ),
    );

    await rm(directory, { recursive: true });
    assert.deepEqual((await generateGallery(root)).images, []);
    assert.equal(await readFile(manifest, 'utf8'), '[]\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
