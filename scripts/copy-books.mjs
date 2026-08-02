import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOK_EXTENSIONS, COVER_EXTENSIONS, findBookRoots } from './catalog-core.mjs';
import { isExcluded, loadPagesExclude } from './pages-exclude.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repositoryRoot, 'dist');
const outputRoot = path.join(distRoot, 'books');
const generatedCoverRoot = path.join(distRoot, 'generated-covers');
const allowed = new Set([...BOOK_EXTENSIONS, ...COVER_EXTENSIONS]);
const maxPagesBytes = 1_000_000_000;
const exclude = await loadPagesExclude(repositoryRoot);
let copiedFiles = 0;
let copiedBytes = 0;

async function copyTree(source, destination, logicalParent) {
  await mkdir(destination, { recursive: true });
  for (const child of await readdir(source, { withFileTypes: true })) {
    if (child.name.startsWith('.')) continue;
    const logicalPath = [logicalParent, child.name].filter(Boolean).join('/');
    if (isExcluded(logicalPath, exclude)) continue;
    const from = path.join(source, child.name);
    const to = path.join(destination, child.name);
    if (child.isDirectory()) await copyTree(from, to, logicalPath);
    else if (allowed.has(path.extname(child.name).toLowerCase()) || child.name.endsWith('.meta.json')) {
      const info = await stat(from);
      await cp(from, to);
      copiedFiles += 1;
      copiedBytes += info.size;
    }
  }
}

async function removeExcludedGeneratedCovers() {
  for (const rule of exclude) {
    const coverRule = BOOK_EXTENSIONS.has(path.posix.extname(rule).toLowerCase()) ? rule.replace(/\.[^.]+$/, '.jpg') : rule;
    const target = path.resolve(generatedCoverRoot, ...coverRule.split('/'));
    if (!target.startsWith(`${generatedCoverRoot}${path.sep}`)) throw new Error(`拒绝清理无效封面路径：${rule}`);
    await rm(target, { recursive: true, force: true });
  }
}

async function directorySize(directory) {
  let total = 0;
  for (const child of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, child.name);
    total += child.isDirectory() ? await directorySize(target) : (await stat(target)).size;
  }
  return total;
}

await mkdir(outputRoot, { recursive: true });
for (const root of await findBookRoots(repositoryRoot)) {
  const destination = root.prefix ? path.join(outputRoot, root.prefix) : outputRoot;
  if ((await stat(root.source)).isDirectory()) await copyTree(root.source, destination, root.prefix);
}
await removeExcludedGeneratedCovers();

const totalBytes = await directorySize(distRoot);
const totalMiB = totalBytes / 1024 / 1024;
console.log(`Pages 资源复制完成：${copiedFiles} 个书库文件，${(copiedBytes / 1024 / 1024).toFixed(1)} MiB；站点总计 ${totalMiB.toFixed(1)} MiB。`);
if (totalBytes > maxPagesBytes) {
  throw new Error(`Pages 站点 ${(totalBytes / 1_000_000_000).toFixed(2)} GB，仍超过 1 GB。请继续编辑 pages-exclude.json。`);
}
