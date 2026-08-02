import type { Book } from '../types';
import { assetUrl } from '../utils/assetUrl';

let cache: Promise<Book[]> | undefined;

export function loadCatalog(): Promise<Book[]> {
  cache ??= fetch(assetUrl('catalog.json'), { cache: 'no-cache' }).then(async (response) => {
    if (!response.ok) throw new Error(`目录请求失败（${response.status}）`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('目录数据格式无效');
    return data as Book[];
  });
  return cache;
}
