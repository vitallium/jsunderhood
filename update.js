require('dotenv').config();
const { outputFile } = require('fs-extra');
const { isEmpty, concat, reverse, last, dissoc, map, head } = require('ramda');
const moment = require('moment');
const { default: dec } = require('bignum-dec');
const { sync } = require('rimraf');

const tokens = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
const getTweets = require('get-tweets');
const getInfo = require('get-twitter-info');
const getFollowers = require('get-twitter-followers');
const log = require('./helpers/log');
const { underhood } = require('./.underhoodrc.json');
const authors = require('./authors');
const saveMedia = require('./helpers/save-media');
// const twitterMentions = require('twitter-mentions');

const ensureFilesForFirstUpdate = require('./helpers/ensure-author-files');
const getAuthorArea = require('./helpers/get-author-area');
const saveAuthorArea = require('./helpers/save-author-area');

const { authorId, first, username } = head(authors);

ensureFilesForFirstUpdate(authorId);

const tweets = getAuthorArea(authorId, 'tweets').tweets || [];
// const mentions = getAuthorArea(authorId, 'mentions').mentions || [];

const tweetsSinceId = isEmpty(tweets) ? dec(first) : last(tweets).id_str;
getTweets(tokens, underhood, tweetsSinceId).then((newTweetsRaw) => {
  const concattedTweets = concat(tweets, reverse(newTweetsRaw));
  saveAuthorArea(authorId, 'tweets', { tweets: concattedTweets });
});

getInfo(tokens, underhood, (err, info) => {
  if (err) throw err;
  saveAuthorArea(authorId, 'info', info);
});

sync(`./dump/images/${username}*`);
saveMedia(tokens, underhood, authorId, (err, media) => {
  if (err) throw err;
  saveAuthorArea(authorId, 'media', media);
});

getFollowers(tokens, underhood, (err, followersWithStatuses) => {
  if (err) throw err;
  const followers = map(dissoc('status'), followersWithStatuses);
  saveAuthorArea(authorId, 'followers', { followers });
});

saveAuthorArea(authorId, 'mentions', { mentions: [] });

// const mentionsSinceId = isEmpty(mentions) ? first : last(mentions).id_str;
// twitterMentions(tokens, mentionsSinceId, (err, newMentionsRaw) => {
//   if (err) throw err;
//   const concattedMentions = concat(mentions, reverse(newMentionsRaw));
//   saveAuthorArea(authorId, 'mentions', { mentions: concattedMentions });
// });

outputFile('./dump/.timestamp', moment().unix(), (err) => {
  log(`${err ? '✗' : '✓'} timestamp`);
});
