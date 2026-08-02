import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateCatalog } from './catalog-core.mjs';

test('扫描多级中文目录并应用元数据和封面', async () => {
  const root = path.join(os.tmpdir(), `ebooks-catalog-${Date.now()}`);
  await mkdir(root, { recursive: true });
  await mkdir(path.join(root, 'books', '技术', 'Linux'), { recursive: true });
  await writeFile(path.join(root, 'books', '技术', 'Linux', '入门.pdf'), 'pdf');
  await writeFile(path.join(root, 'books', '技术', 'Linux', '入门.jpg'), 'cover');
  await writeFile(path.join(root, 'books', '技术', 'Linux', '入门.meta.json'), JSON.stringify({ title: 'Linux 入门', tags: ['Linux'] }));
  const catalog = await generateCatalog(root);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, '技术/Linux/入门.pdf');
  assert.equal(catalog[0].title, 'Linux 入门');
  assert.equal(catalog[0].cover, 'books/技术/Linux/入门.jpg');
});

test('兼容仓库根级分类目录', async () => {
  const root = path.join(os.tmpdir(), `ebooks-legacy-${Date.now()}`);
  await mkdir(path.join(root, '小说', '科幻'), { recursive: true });
  await writeFile(path.join(root, '小说', '科幻', '星海.epub'), 'epub');
  await writeFile(path.join(root, '小说', '科幻', '星海.png'), 'cover');
  const [book] = await generateCatalog(root);
  assert.equal(book.id, '小说/科幻/星海.epub');
  assert.deepEqual(book.category, ['小说', '科幻']);
  assert.equal(book.cover, 'books/小说/科幻/星海.png');
});

test('目录和文件排除规则不会进入书目', async () => {
  const root = path.join(os.tmpdir(), `ebooks-exclude-${Date.now()}`);
  await mkdir(path.join(root, 'books', '小说', '科幻'), { recursive: true });
  await writeFile(path.join(root, 'books', '小说', '科幻', '保留.epub'), 'epub');
  await writeFile(path.join(root, 'books', '小说', '科幻', '排除.epub'), 'epub');
  await mkdir(path.join(root, 'books', '小说', '悬疑'), { recursive: true });
  await writeFile(path.join(root, 'books', '小说', '悬疑', '整类排除.txt'), 'text');
  const catalog = await generateCatalog(root, { exclude: ['小说/科幻/排除.epub', '小说/悬疑'] });
  assert.deepEqual(catalog.map((book) => book.id), ['小说/科幻/保留.epub']);
});
