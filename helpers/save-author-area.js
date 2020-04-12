const { outputJSON } = require('fs-extra');
const log = require('./log');

const spaces = 2;

module.exports = function saveAuthorArea(authorId, area, content) {
  outputJSON(`./dump/${authorId}-${area}.json`, content, { spaces }, (err) => {
    log(`${err ? '✗' : '✓'} ${authorId}’s ${area}`);
  });
};
