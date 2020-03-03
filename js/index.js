import { initate as likely } from 'ilyabirman-likely';
import moment from 'moment';
import Tablesort from 'tablesort';
// eslint-disable-next-line import/no-webpack-loader-syntax,import/no-unresolved
import 'imports-loader?Tablesort=tablesort!tablesort/src/sorts/tablesort.number';

document.addEventListener('DOMContentLoaded', () => {
  likely();

  const d = document;
  const $ = d.querySelector.bind(d);

  if ($('.js-stats')) {
    // eslint-disable-next-line no-new
    new Tablesort($('.host-stats'), { descending: true });

    const lastUpdated = $('.js-last-updated');
    const timestamp = lastUpdated.getAttribute('data-timestamp');
    lastUpdated.textContent = moment
      .unix(timestamp)
      .locale('ru')
      .fromNow();
  }
});
