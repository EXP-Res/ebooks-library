import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const PAGES_EXCLUDE_FILE = 'pages-exclude.json';

export function normalizeExcludePath(value) {
  if (typeof value !== 'string') throw new Error('每条排除规则必须是字符串');
  const normalized = value.trim().replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '');
  if (!normalized) throw new Error('排除路径不能为空');
  if (path.posix.isAbsolute(normalized) || /^[a-z]:\//i.test(normalized)) throw new Error(`排除路径必须是相对路径：${value}`);
  if (normalized.split('/').includes('..')) throw new Error(`排除路径不能包含 ..：${value}`);
  return normalized.replace(/\/{2,}/g, '/');
}

export function normalizeExcludeRules(values) {
  if (!Array.isArray(values)) throw new Error(`${PAGES_EXCLUDE_FILE} 必须是字符串数组`);
  return [...new Set(values.map(normalizeExcludePath))];
}

export async function loadPagesExclude(repositoryRoot) {
  const file = path.join(repositoryRoot, PAGES_EXCLUDE_FILE);
  let source;
  try { source = await readFile(file, 'utf8'); }
  catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`缺少 ${PAGES_EXCLUDE_FILE}，请创建 JSON 相对路径数组`);
    throw error;
  }
  try { return normalizeExcludeRules(JSON.parse(source.replace(/^\uFEFF/, ''))); }
  catch (error) { throw new Error(`${PAGES_EXCLUDE_FILE} 无效：${error instanceof Error ? error.message : error}`); }
}

export function isExcluded(relativePath, rules) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '');
  return rules.some((rule) => normalized === rule || normalized.startsWith(`${rule}/`));
}
