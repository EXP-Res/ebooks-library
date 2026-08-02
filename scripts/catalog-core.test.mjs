import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateCatalog } from './catalog-core.mjs';

test('扫描多级中文目录并应用元数据和封面', async () => {
  const root = path.join(os.tmpdir(), `ebooks-catalog-${Date.now()}`);
  await mkdir(root, { recursive: true });
  await mkdir(path.join(root, 'ebooks', '技术', 'Linux'), { recursive: true });
  await writeFile(path.join(root, 'ebooks', '技术', 'Linux', '入门.pdf'), 'pdf');
  await writeFile(path.join(root, 'ebooks', '技术', 'Linux', '入门.jpg'), 'cover');
  await writeFile(path.join(root, 'ebooks', '技术', 'Linux', '入门.meta.json'), JSON.stringify({ title: 'Linux 入门', tags: ['Linux'] }));
  const catalog = await generateCatalog(root);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, '技术/Linux/入门.pdf');
  assert.equal(catalog[0].title, 'Linux 入门');
  assert.equal(catalog[0].cover, 'books/技术/Linux/入门.jpg');
});

test('缺少 ebooks 目录时明确报错', async () => {
  const root = path.join(os.tmpdir(), `ebooks-missing-${Date.now()}`);
  await mkdir(root, { recursive: true });
  await assert.rejects(() => generateCatalog(root), /未找到书库目录/);
});

test('目录和文件排除规则不会进入书目', async () => {
  const root = path.join(os.tmpdir(), `ebooks-exclude-${Date.now()}`);
  await mkdir(path.join(root, 'ebooks', '小说', '科幻'), { recursive: true });
  await writeFile(path.join(root, 'ebooks', '小说', '科幻', '保留.epub'), 'epub');
  await writeFile(path.join(root, 'ebooks', '小说', '科幻', '排除.epub'), 'epub');
  await mkdir(path.join(root, 'ebooks', '小说', '悬疑'), { recursive: true });
  await writeFile(path.join(root, 'ebooks', '小说', '悬疑', '整类排除.txt'), 'text');
  const catalog = await generateCatalog(root, { exclude: ['小说/科幻/排除.epub', '小说/悬疑'] });
  assert.deepEqual(catalog.map((book) => book.id), ['小说/科幻/保留.epub']);
});
