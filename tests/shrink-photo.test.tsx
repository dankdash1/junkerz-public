import { afterEach, expect, it, vi } from 'vitest';
import { formatMB, jpegName, largestFile, needsShrink, shrinkFormDataPhotos, shrinkPhoto } from '../src/lib/shrink-photo';

const MB = 1024 * 1024;
const fileOf = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type });

afterEach(() => vi.unstubAllGlobals());

it('decides which files need shrinking', () => {
  expect(needsShrink(fileOf('quote.pdf', 'application/pdf', 6 * MB))).toBe(false);
  expect(needsShrink(fileOf('small.jpg', 'image/jpeg', 1 * MB))).toBe(false);
  expect(needsShrink(fileOf('small.png', 'image/png', 2 * MB))).toBe(false);
  expect(needsShrink(fileOf('small.webp', 'image/webp', 100))).toBe(false);
  expect(needsShrink(fileOf('big.jpg', 'image/jpeg', 3 * MB))).toBe(true);
  expect(needsShrink(fileOf('IMG_0001.HEIC', 'image/heic', 1 * MB))).toBe(true);
  expect(needsShrink(fileOf('IMG_0002.heif', '', 1 * MB))).toBe(true);
  expect(needsShrink(fileOf('notes.txt', 'text/plain', 9 * MB))).toBe(false);
});

it('names and sizes files for messages', () => {
  expect(jpegName('IMG_0001.HEIC')).toBe('IMG_0001.jpg');
  expect(jpegName('car.photo.png')).toBe('car.photo.jpg');
  expect(jpegName('')).toBe('photo.jpg');
  expect(formatMB(11.2 * MB)).toBe('11.2 MB');
});

it('passes PDFs and small allowed images through untouched', async () => {
  const pdf = fileOf('quote.pdf', 'application/pdf', 9 * MB);
  const jpg = fileOf('small.jpg', 'image/jpeg', 500_000);
  expect(await shrinkPhoto(pdf)).toBe(pdf);
  expect(await shrinkPhoto(jpg)).toBe(jpg);
});

it('returns the original file when the browser cannot decode it', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('nope'); }));
  vi.stubGlobal('Image', undefined);
  const heic = fileOf('IMG_0001.HEIC', 'image/heic', 3 * MB);
  expect(await shrinkPhoto(heic)).toBe(heic);
});

it('keeps form fields and reports the largest file', async () => {
  const fields = new FormData();
  const pdf = fileOf('quote.pdf', 'application/pdf', 2 * MB);
  fields.set('company', 'Other Co');
  fields.set('outside_offer', pdf);
  await shrinkFormDataPhotos(fields);
  expect(fields.get('company')).toBe('Other Co');
  expect((fields.get('outside_offer') as File).size).toBe(pdf.size);
  expect(largestFile(fields)?.name).toBe('quote.pdf');
  expect(largestFile(new FormData())).toBeNull();
});
