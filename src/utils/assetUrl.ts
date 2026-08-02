export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const encoded = clean.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${import.meta.env.BASE_URL}${encoded}`;
}

export function originalFileUrl(path: string): string {
  return assetUrl(path);
}
