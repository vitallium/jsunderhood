const { map, merge } = require('ramda');
const authors = require('../authors');
const getAuthorArea = require('../helpers/get-author-area');

const saturate = author =>
  merge(author, {
    info: getAuthorArea(author.authorId, 'info') || {},
    followers: getAuthorArea(author.authorId, 'followers').followers || [],
    tweets: getAuthorArea(author.authorId, 'tweets').tweets || [],
    media: getAuthorArea(author.authorId, 'media') || {},
    mentions: getAuthorArea(author.authorId, 'mentions').mentions || [],
  });

module.exports = map(saturate, authors);
