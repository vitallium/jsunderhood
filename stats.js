const stats = require('tweets-stats');
const maxValues = require('max-values');
const { merge } = require('ramda');
const getGainedFollowers = require('./helpers/get-gained-followers');
const getDiffFollowers = require('./helpers/get-diff-followers');

function getStatsPerAuthor(authors) {
  return authors
    .map(author =>
      merge(author, {
        gainedFollowers: getGainedFollowers(author.authorId),
      }),
    )
    .map(author =>
      merge(author, {
        diffFollowers: getDiffFollowers(author.authorId),
      }),
    )
    .map(author => merge(author, stats(author.tweets)));
}

module.exports = function getStats(authors) {
  if (!authors || authors.length === 0) return;

  return maxValues(getStatsPerAuthor(authors), [
    'tweets',
    'gainedFollowers',
    'diffFollowers.gain',
    'diffFollowers.loss',
    'own.total',
    'replies.total',
    'retweets.total',
    'favorited.total',
    'favorited.average',
    'retweeted.total',
    'retweeted.average',
  ]);
};
