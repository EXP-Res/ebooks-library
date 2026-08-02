import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isExcluded } from './pages-exclude.mjs';

export const BOOK_EXTENSIONS = new Set(['.pdf', '.epub', '.txt', '.md', '.markdown']);
export const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const toPosix = (value) => value.split(path.sep).join('/');

async function readMetadata(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn(`忽略无效元数据：${filePath}`);
    return {};
  }
}

async function findCover(directory, stem, explicitCover) {
  const candidates = [
    explicitCover,
    ...COVER_EXTENSIONS.map((extension) => `${stem}${extension}`),
    ...COVER_EXTENSIONS.map((extension) => `cover${extension}`),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const target = path.resolve(directory, candidate);
    if (!target.startsWith(`${path.resolve(directory)}${path.sep}`) && target !== path.resolve(directory)) continue;
    try {
      if ((await stat(target)).isFile()) return path.basename(target);
    } catch {}
  }
  return undefined;
}

async function walk(directory, root, entries) {
  const children = await readdir(directory, { withFileTypes: true });
  for (const child of children) {
    if (child.name.startsWith('.')) continue;
    const target = path.join(directory, child.name);
    if (child.isDirectory()) {
      await walk(target, root, entries);
      continue;
    }
    const extension = path.extname(child.name).toLowerCase();
    if (!BOOK_EXTENSIONS.has(extension)) continue;

    const info = await stat(target);
    const relative = toPosix(path.relative(root, target));
    const stem = path.basename(child.name, extension);
    const metadata = await readMetadata(path.join(directory, `${stem}.meta.json`));
    const coverName = await findCover(directory, stem, metadata.cover);
    const category = toPosix(path.dirname(relative)) === '.' ? [] : toPosix(path.dirname(relative)).split('/');
    const coverRelative = coverName ? toPosix(path.join(path.dirname(relative), coverName)) : undefined;
    entries.push({
      id: relative,
      title: metadata.title || stem,
      fileName: child.name,
      format: extension === '.md' || extension === '.markdown' ? 'markdown' : extension.slice(1),
      category,
      categoryPath: category.join('/'),
      path: `books/${relative}`,
      cover: coverRelative ? `books/${coverRelative}` : undefined,
      size: info.size,
      updatedAt: info.mtime.toISOString(),
      author: metadata.author,
      description: metadata.description,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    });
  }
}

export async function findBookRoots(repositoryRoot) {
  const conventional = path.join(repositoryRoot, 'ebooks');
  try {
    if ((await stat(conventional)).isDirectory()) return [{ source: conventional, prefix: '' }];
  } catch {}
  throw new Error(`未找到书库目录：${conventional}`);
}

export async function generateCatalog(repositoryRoot, options = {}) {
  const exclude = options.exclude || [];
  const entries = [];
  const roots = await findBookRoots(repositoryRoot);
  for (const root of roots) {
    const nested = [];
    await walk(root.source, root.source, nested);
    for (const entry of nested) {
      const id = root.prefix ? `${root.prefix}/${entry.id}` : entry.id;
      if (isExcluded(id, exclude)) continue;
      const category = root.prefix ? [root.prefix, ...entry.category] : entry.category;
      const coverRelative = entry.cover?.slice('books/'.length);
      let generatedCover;
      if (!coverRelative) {
        const generatedPath = path.join(repositoryRoot, 'public', 'generated-covers', id.replace(/\.[^.]+$/, '.jpg'));
        try {
          if ((await stat(generatedPath)).isFile()) generatedCover = `generated-covers/${id.replace(/\.[^.]+$/, '.jpg')}`;
        } catch {}
      }
      entries.push({
        ...entry,
        id,
        category,
        categoryPath: category.join('/'),
        path: `books/${id}`,
        cover: coverRelative ? `books/${root.prefix ? `${root.prefix}/` : ''}${coverRelative}` : generatedCover,
      });
    }
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id, 'zh-CN'));
}
