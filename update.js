import dotenv from 'dotenv';

dotenv.config();

import log from './helpers/log';
import { outputFile } from 'fs-extra';
import { isEmpty, concat, reverse, last, dissoc, map, head } from 'ramda';
import moment from 'moment';
import dec from 'bignum-dec';
import { sync as rm } from 'rimraf';

import { underhood } from './.underhoodrc.json';
import authors from './authors';

const tokens = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
import getTweets from 'get-tweets';
import getInfo from 'get-twitter-info';
import saveMedia from './helpers/save-media';
import getFollowers from 'get-twitter-followers';
// import twitterMentions from 'twitter-mentions';

import ensureFilesForFirstUpdate from './helpers/ensure-author-files';
import getAuthorArea from './helpers/get-author-area';
import saveAuthorArea from './helpers/save-author-area';

const { authorId, first, username } = head(authors);

ensureFilesForFirstUpdate(authorId);

const tweets = getAuthorArea(authorId, 'tweets').tweets || [];
// const mentions = getAuthorArea(authorId, 'mentions').mentions || [];

const tweetsSinceId = isEmpty(tweets) ? dec(first) : last(tweets).id_str;
getTweets(tokens, underhood, tweetsSinceId, (err, newTweetsRaw) => {
  if (err) throw err;
  const concattedTweets = concat(tweets, reverse(newTweetsRaw));
  saveAuthorArea(authorId, 'tweets', { tweets: concattedTweets });
});

getInfo(tokens, underhood, (err, info) => {
  if (err) throw err;
  saveAuthorArea(authorId, 'info', info);
});

rm(`./dump/images/${username}*`);
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

outputFile('./dump/.timestamp', moment().unix(), err => {
  log(`${err ? '✗' : '✓'} timestamp`);
});
