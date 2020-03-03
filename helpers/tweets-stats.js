const { is } = require('ramda');
const { twitterId } = require('./../.underhoodrc.json');

const isSelfReply = tweet => tweet.in_reply_to_user_id === twitterId;
const isReply = tweet => !!tweet.in_reply_to_screen_name && !isSelfReply(tweet);
const isRetweet = tweet => !!tweet.retweeted_status;
const sumRetweeted = (state, tweet) => state + tweet.retweet_count;
const sumFavorited = (state, tweet) => state + tweet.favorite_count;
const isOwn = tweet => !isReply(tweet) && !isRetweet(tweet);

const getObject = (array, percent) => ({
  total: array.length,
  percent: Number(array.length / percent || 0).toFixed(2),
});

const getIntObject = (sum, divider) => ({
  total: sum,
  average: Number(sum / divider || 0).toFixed(2),
});

const tweetsStats = input => {
  if (!input || !is(Array, input)) return null;

  const tweets = input.length;
  const percent = tweets / 100;
  const own = input.filter(isOwn);
  const replies = input.filter(isReply);
  const retweets = input.filter(isRetweet);

  return {
    tweets,
    own: getObject(own, percent),
    replies: getObject(replies, percent),
    retweets: getObject(retweets, percent),
    retweeted: getIntObject(own.reduce(sumRetweeted, 0), own.length),
    favorited: getIntObject(own.reduce(sumFavorited, 0), own.length),
  };
};

module.exports = tweetsStats;
