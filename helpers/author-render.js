const moment = require('moment');
const {
  pipe,
  filter,
  groupBy,
  prop,
  converge,
  inc,
  dec,
  length,
  findIndex,
  propEq,
  path,
  map,
  head,
  split,
  nth,
  replace,
  toUpper,
  tail,
  concat,
} = require('ramda');
const numd = require('numd');
const renderTweet = require('tweet.md');
const { html } = require('commonmark-helpers');
const unidecode = require('unidecode');
const trimTag = require('trim-html-tag');
const { parse } = require('url');
const ungroupInto = require('./ungroup-into');
const getLinks = require('./get-links');
const authors = require('../dump');
const { underhood } = require('../.underhoodrc.json');

const getQuotedUser = pipe(
  path(['entities', 'urls']),
  map(prop('expanded_url')),
  map(replace('/mobile.twitter.com/', '/twitter.com/')),
  filter(url => parse(url).host === 'twitter.com'),
  head,
  pipe(parse, prop('path'), split('/'), nth(1)),
);

moment.locale('ru');

const weekday = date => moment(new Date(date)).format('dddd');
const tweetLink = tweet => `https://twitter.com/${underhood}/status/${tweet.id_str}`;
const tweetTime = tweet => moment(new Date(tweet.created_at)).format('H:mm');

const authorsToPost = filter(author => author.post !== false, authors);

const authorIndex = author => findIndex(propEq('authorId', author.authorId))(authorsToPost);
const isFirstAuthor = author => authorIndex(author) === dec(length(authorsToPost));
const isLastAuthor = author => author.authorId === prop('authorId', head(authorsToPost));
const nextAuthor = author => {
  if (!isLastAuthor(author)) return nth(dec(authorIndex(author)), authorsToPost);
};
const prevAuthor = author => {
  if (!isFirstAuthor(author)) return nth(inc(authorIndex(author)), authorsToPost);
};

const d = input => moment(new Date(input)).format('D MMMM YYYY');
const tweetsUnit = numd('твит', 'твита', 'твитов');
const capitalize = converge(concat, [pipe(head, toUpper), tail]);
const filterTimeline = item => item.text[0] !== '@' || item.text.indexOf(`@${underhood}`) === 0;
const prepareTweets = pipe(
  filter(filterTimeline),
  groupBy(pipe(prop('created_at'), weekday)),
  ungroupInto('weekday', 'tweets'),
);

module.exports = {
  d,
  prepareTweets,
  capitalize,
  tweetsUnit,
  getQuotedUser,
  unidecode,
  prevAuthor,
  nextAuthor,
  render: pipe(renderTweet, html, trimTag),
  tweetTime,
  tweetLink,
  getLinks,
};
