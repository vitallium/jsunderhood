const p = require('path');
const hasha = require('hasha');
const { pipe, memoize, curryN, __ } = require('ramda');

const join = curryN(3, p.join);
const hash = curryN(2, hasha.fromFileSync);

const hashPath = pipe(
  join(process.cwd(), 'dist'),
  hash(__, {
    algorithm: 'md5',
  }),
);

const bust = path => `${path}?${hashPath(path)}`;

module.exports = memoize(bust);
