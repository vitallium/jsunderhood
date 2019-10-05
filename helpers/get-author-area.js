import { readJsonSync, existsSync } from 'fs-extra';

export default function getAuthorArea(authorId, area) {
  const areaSuffix = area ? `-${area}` : '';
  const path = `./dump/${authorId}${areaSuffix}.json`;
  if (existsSync(path)) {
    return readJsonSync(path);
  }

  return {};
}
