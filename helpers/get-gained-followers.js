const R = require('ramda');
const getAuthorArea = require('./get-author-area');
const authors = require('../authors');

const prev = authorId =>
  (authors[R.inc(R.findIndex(R.propEq('authorId', authorId), authors))] || {}).authorId;
const followers = authorId => getAuthorArea(authorId, 'info').followers_count || 0;

// getGainedFollowers :: String -> Number
module.exports = function getGainedFollowers(authorId) {
  return followers(authorId) - followers(prev(authorId));
};
