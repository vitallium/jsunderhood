import { initate as likely } from 'ilyabirman-likely';

likely();

const d = document;
const $ = d.querySelector.bind(d);

if ($('.js-stats')) {
  require([
    'moment',
    'tablesort',
    'imports-loader?Tablesort=tablesort!tablesort/src/sorts/tablesort.number',
  ], (moment, tablesort) => {
    tablesort($('.host-stats'), { descending: true });

    const lastUpdated = $('.js-last-updated');
    const timestamp = lastUpdated.getAttribute('data-timestamp');
    lastUpdated.textContent = moment
      .unix(timestamp)
      .locale('ru')
      .fromNow();
  });
}
