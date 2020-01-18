const { readJsonSync, existsSync } = require('fs-extra');

module.exports = function getAuthorArea(authorId, area) {
  const areaSuffix = area ? `-${area}` : '';
  const path = `./dump/${authorId}${areaSuffix}.json`;
  if (existsSync(path)) {
    return readJsonSync(path);
  }

  return {};
};
