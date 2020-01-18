const { readFileSync } = require('fs');
const moment = require('moment');

const cwd = process.cwd();
const timestamp = (() => {
  try {
    return parseInt(readFileSync(`${cwd}/dump/.timestamp`, `utf8`), 10);
  } catch (e) {
    return parseInt(moment.unix(), 10);
  }
})();

const date = moment.unix(timestamp);

function lastUpdated() {
  return date.locale('ru').format('D MMMM в H:mm');
}

lastUpdated.raw = timestamp;

module.exports = lastUpdated;
