import R from 'ramda';
import getAuthorArea from './get-author-area';
import authors from '../authors';

const prev = (authorId) => (authors[R.inc(R.findIndex(R.propEq('authorId', authorId), authors))] || {}).authorId;
const followers = (authorId) => getAuthorArea(authorId, 'info').followers_count || 0;

// getGainedFollowers :: String -> Number
export default function getGainedFollowers(authorId) {
  return followers(authorId) - followers(prev(authorId));
}
