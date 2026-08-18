const ASSET_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

export function assetUrl(path) {
  if (!path) return '';
  return ASSET_BASE + path;
}
