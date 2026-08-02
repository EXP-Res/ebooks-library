import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, DOMMatrix, ImageData, loadImage, Path2D } from '@napi-rs/canvas';
import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';
import { generateCatalog } from './catalog-core.mjs';
import { loadPagesExclude } from './pages-exclude.mjs';

globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ebookRoot = path.join(repositoryRoot, 'ebooks');
const outputRoot = path.join(repositoryRoot, 'public', 'generated-covers');

async function exists(file) {
  try { return (await stat(file)).isFile(); }
  catch { return false; }
}

async function thumbnail(buffer) {
  const image = await loadImage(buffer);
  const scale = Math.min(1, 420 / image.width, 600 / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  return canvas.toBuffer('image/jpeg', 82);
}

function firstElement(parent, name) {
  return parent.getElementsByTagName(name).item(0) || parent.getElementsByTagNameNS('*', name).item(0);
}

const parseXml = (value) => new DOMParser({ errorHandler: () => {} }).parseFromString(value.replace(/^\uFEFF/, ''), 'application/xml');

async function epubCover(file) {
  const zip = await JSZip.loadAsync(await readFile(file));
  const containerEntry = zip.file('META-INF/container.xml');
  if (!containerEntry) throw new Error('缺少 META-INF/container.xml');
  const container = parseXml(await containerEntry.async('text'));
  const packagePath = firstElement(container, 'rootfile')?.getAttribute('full-path');
  if (!packagePath) throw new Error('无法定位 OPF');
  const packageEntry = zip.file(packagePath);
  if (!packageEntry) throw new Error('OPF 文件不存在');
  const opf = parseXml(await packageEntry.async('text'));
  const items = [...Array.from(opf.getElementsByTagName('item')), ...Array.from(opf.getElementsByTagNameNS('*', 'item'))];
  const coverId = [...Array.from(opf.getElementsByTagName('meta')), ...Array.from(opf.getElementsByTagNameNS('*', 'meta'))]
    .find((meta) => meta.getAttribute('name') === 'cover')?.getAttribute('content');
  const guideHref = [...Array.from(opf.getElementsByTagName('reference')), ...Array.from(opf.getElementsByTagNameNS('*', 'reference'))]
    .find((reference) => reference.getAttribute('type') === 'cover')?.getAttribute('href');
  const coverItem = items.find((item) => item.getAttribute('id') === coverId)
    || items.find((item) => (item.getAttribute('properties') || '').split(/\s+/).includes('cover-image'))
    || items.find((item) => /cover/i.test(item.getAttribute('id') || '') && /^image\//.test(item.getAttribute('media-type') || ''))
    || items.find((item) => /^image\//.test(item.getAttribute('media-type') || ''));
  const href = coverItem?.getAttribute('href') || guideHref;
  if (!href) throw new Error('未找到内置封面');
  const coverPath = path.posix.normalize(path.posix.join(path.posix.dirname(packagePath), decodeURIComponent(href.split('#')[0])));
  const coverEntry = zip.file(coverPath) || Object.values(zip.files).find((entry) => decodeURIComponent(entry.name) === coverPath);
  if (!coverEntry || coverEntry.dir) throw new Error('内置封面文件不存在');
  return thumbnail(await coverEntry.async('nodebuffer'));
}

async function pdfCover(file) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(await readFile(file)), disableWorker: true, useSystemFonts: true });
  const document = await task.promise;
  try {
    const page = await document.getPage(1);
    const natural = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(1, 420 / natural.width) });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas.toBuffer('image/jpeg', 82);
  } finally { await task.destroy(); }
}

const pagesMode = process.argv.includes('--pages');
const exclude = pagesMode ? await loadPagesExclude(repositoryRoot) : [];
const catalog = await generateCatalog(repositoryRoot, { exclude });
let created = 0;
let skipped = 0;
let unavailable = 0;
let failed = 0;

for (const book of catalog) {
  if (book.cover || !['epub', 'pdf'].includes(book.format)) continue;
  const output = path.join(outputRoot, book.id.replace(/\.[^.]+$/, '.jpg'));
  if (await exists(output)) { skipped += 1; continue; }
  const source = path.join(ebookRoot, ...book.id.split('/'));
  try {
    const cover = book.format === 'epub' ? await epubCover(source) : await pdfCover(source);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, cover);
    created += 1;
  } catch (error) {
    if (error instanceof Error && error.message === '未找到内置封面') {
      unavailable += 1;
      continue;
    }
    failed += 1;
    console.warn(`封面生成失败：${book.id}（${error instanceof Error ? error.message : error}）`);
  }
}

console.log(`封面生成完成：新增 ${created}，已存在 ${skipped}，无内置封面 ${unavailable}，失败 ${failed}。`);
