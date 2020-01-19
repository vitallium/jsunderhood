const R = require('ramda');

const filterUsernames = (username, acc) => R.filter(R.propEq('username', username), acc);

const reduceAuthorId = (acc, author) => {
  const { username } = author;
  const times = R.length(filterUsernames(username, acc));
  const authorId = times > 0 ? `${username}-${R.inc(times)}` : username;

  return R.prepend(R.assoc('authorId', authorId, author), acc);
};

// authorId :: [a] -> [b]
module.exports = R.reduceRight(reduceAuthorId, []);
