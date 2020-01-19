const getInfo = require('get-twitter-info');
const tokens = require('twitter-tokens');
const { reverse, merge } = require('ramda');
const { remove, outputJSON } = require('fs-extra');
const rimraf = require('rimraf');
const authors = require('./authors');
const getAuthorArea = require('./helpers/get-author-area');
const saveAuthorArea = require('./helpers/save-author-area');
const log = require('./helpers/log');
const saveMedia = require('./helpers/save-media');

const spaces = 2;

// INFO
function initInfo({ username }) {
  getInfo(tokens, username, (err, info) => {
    if (err) throw err;
    const existing = getAuthorArea(username, 'info');
    const result = merge(info, existing);
    saveAuthorArea(username, 'info', result);
  });
}
authors.map(initInfo);

// MEDIA
function initMedia({ username }) {
  saveMedia(tokens, username, username, (err, media) => {
    if (err) throw err;
    saveAuthorArea(username, 'media', media);
  });
}
authors.map(initMedia);

// MENTIONS
function createEmptyMentions({ username }) {
  outputJSON(`./dump/${username}-mentions.json`, { mentions: [] }, { spaces }, saveErr => {
    log(`${saveErr ? '✗' : '✓'} ${username}’s empty mentions`);
  });
}
authors.map(createEmptyMentions);

// TWEETS
function reverseAndRenameTweets({ username }) {
  const { tweets: oldTweets } = getAuthorArea(username);
  const tweets = reverse(oldTweets);
  saveAuthorArea(username, 'tweets', { tweets });
  remove(`./dump/${username}.json`, rmErr => {
    log(`${rmErr ? '✗' : '✓'} ${username}’s old tweets removed`);
  });
}
authors.map(reverseAndRenameTweets);

rimraf.sync('./migration.js');
