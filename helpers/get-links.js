const tweetLinks = require('tweet-links');
const {
  values,
  sortBy,
  prop,
  head,
  apply,
  objOf,
  toPairs,
  pipe,
  length,
  mapObjIndexed,
  groupBy,
  map,
  filter,
  flatten,
  uniq,
} = require('ramda');
const { parse, format } = require('url');
const ungroupInto = require('./ungroup-into');

const notTwitter = (url) => url.host !== 'twitter.com';
const obj2arr = pipe(toPairs, map(apply(objOf)));

const extractLinks = pipe(map(tweetLinks), flatten, uniq);

const filterTwitterLinks = pipe(map(parse), filter(notTwitter), map(format));

const groupByHost = pipe(groupBy(pipe(parse, prop('host'))), obj2arr, map(pipe(values, flatten)));

const moveMinorsToOther = pipe(
  groupBy((item) => (length(item) < 5 ? 'other' : parse(head(item)).host)),
  mapObjIndexed(flatten),
);

const moveOtherToEnd = sortBy((group) => group.host === 'other');

const getLinks = pipe(
  extractLinks,
  filterTwitterLinks,
  groupByHost,
  moveMinorsToOther,
  ungroupInto('host', 'links'),
  moveOtherToEnd,
);

module.exports = getLinks;
