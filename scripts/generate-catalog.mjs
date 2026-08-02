import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCatalog } from './catalog-core.mjs';
import { loadPagesExclude } from './pages-exclude.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(repositoryRoot, 'public');
const pagesMode = process.argv.includes('--pages');
const exclude = pagesMode ? await loadPagesExclude(repositoryRoot) : [];
const catalog = await generateCatalog(repositoryRoot, { exclude });

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`已生成 ${catalog.length} 本电子书的目录${pagesMode ? `，应用 ${exclude.length} 条 Pages 排除规则` : ''}。`);
