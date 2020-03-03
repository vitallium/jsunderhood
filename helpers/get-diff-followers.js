const diff = require('lodash.difference');
const R = require('ramda');
const getAuthorArea = require('./get-author-area');
const authors = require('../authors');

const prev = authorId =>
  (authors[R.inc(R.findIndex(R.propEq('authorId', authorId), authors))] || {}).authorId;
const followers = authorId =>
  R.map(R.prop('id_str'), getAuthorArea(authorId, 'followers').followers || []);

const getDiffFollowers = authorId => {
  const currentFollowers = followers(authorId);
  const previousFollowers = followers(prev(authorId));

  if (R.length(previousFollowers) > 0) {
    return {
      gain: R.length(diff(currentFollowers, previousFollowers)),
      loss: R.length(diff(previousFollowers, currentFollowers)),
    };
  }

  return null;
};

module.exports = getDiffFollowers;
