const { pipe, toPairs, map, zipObj } = require('ramda');

const ungroupInto = (first, second) => pipe(toPairs, map(zipObj([first, second])));

module.exports = ungroupInto;
