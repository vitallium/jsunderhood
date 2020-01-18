const { ensureFileSync, ensureDirSync } = require('fs-extra');

module.exports = function ensureAuthorFiles(authorId) {
  ensureDirSync('./dump/images');
  ['info', 'tweets', 'media', 'mentions'].map(area => {
    ensureFileSync(`./dump/${authorId}-${area}.json`);
  });
};
