import buildbranch from 'buildbranch';
import rimraf from 'rimraf';
import each from 'each-done';
import express from 'express';
import fs, {
  outputFile as output,
} from 'fs-extra';
import {
  html,
} from 'commonmark-helpers';
import numbers from 'typographic-numbers';
import numd from 'numd';
import RSS from 'rss';
import {
  merge,
  pipe,
  prop,
  head,
  splitEvery,
} from 'ramda';
import renderTweet from 'tweet.md';
import autoprefixer from 'autoprefixer';
import pcssImport from 'postcss-import';
import pcssInitial from 'postcss-initial';
import webpack from 'webpack';

import gulp from 'gulp';
import gulpJade from 'gulp-jade';
import rename from 'gulp-rename';
import watch from 'gulp-watch';
import {
  log,
  PluginError,
} from 'gulp-util';
import jimp from 'gulp-jimp';
import postcss from 'gulp-postcss';

import articleData from 'article-data';
import getStats from './stats.js';
import underhood from './.underhoodrc.json';
import webpackConfig from './webpack.config.babel.js';

import authorRender from './helpers/author-render';
import bust from './helpers/bust';
import lastUpdated from './helpers/last-updated';

import authors from './dump';

const latestInfo = (head(authors) || {}).info;

const jadeDefaults = {
  pretty: true,
  locals: {
    site: underhood.site,
    latestInfo,
    numbers: (input) => numbers(input, {
      locale: 'ru',
    }),
    people: numd('человек', 'человека', 'человек'),
  },
};

const getOptions = (opts = {}) => {
  const locals = {
    ...jadeDefaults.locals,
    ...opts.locals,
  };

  return {
    ...jadeDefaults,
    opts,
    locals,
  };
};

const jade = (opts) => gulpJade(getOptions(opts));
const firstTweet = pipe(prop('tweets'), head);
const render = pipe(renderTweet, html);

/**
 * MAIN TASKS
 */
gulp.task('css', () => {
  return gulp.src('css/styles.css')
    .pipe(postcss([
      pcssImport,
      pcssInitial,
      autoprefixer,
    ]))
    .pipe(gulp.dest('./dist/css/'));
});

gulp.task('index', gulp.series('css', () => {
  const authorsToPost = authors.filter((author) => author.post !== false);

  return gulp.src('layouts/index.jade')
    .pipe(jade({
      locals: {
        title: `Сайт @${underhood.underhood}`,
        desc: underhood.underhoodDesc,
        underhood,
        currentAuthor: head(authors),
        authors: splitEvery(3, authorsToPost),
        helpers: {
          bust,
          firstTweet,
          render,
        },
      },
    }))
    .pipe(rename({
      basename: 'index',
    }))
    .pipe(gulp.dest('./dist/'));
}));

gulp.task('stats', gulp.series('css', () => {
  return gulp.src('./layouts/stats.jade')
    .pipe(jade({
      locals: {
        title: `Статистика @${underhood.underhood}`,
        url: 'stats/',
        desc: underhood.underhoodDesc,
        lastUpdated,
        underhood,
        stats: getStats(authors),
        helpers: {
          bust,
        },
      },
    }))
    .pipe(rename({
      dirname: 'stats',
      basename: 'index',
    }))
    .pipe(gulp.dest('./dist/'));
}));

gulp.task('md-pages', gulp.series('css', (done) => {
  each([{
      name: 'about',
      title: 'О проекте',
    },
    {
      name: 'authoring',
      title: 'Авторам',
    },
    {
      name: 'instruction',
      title: 'Инструкция',
    },
  ], (item) => {
    const page = fs.readFileSync(`./pages/${item.name}.md`, {
      encoding: 'utf8',
    });
    // TODO change to 'ru' after moment/moment#2634 will be published
    const article = articleData(page, 'D MMMM YYYY', 'en');
    return gulp.src('layouts/article.jade')
      .pipe(jade({
        locals: merge(article, {
          title: item.title,
          url: `${item.name}/`,
          underhood,
          helpers: {
            bust,
          },
        }),
      }))
      .pipe(rename({
        dirname: item.name,
        basename: 'index',
      }))
      .pipe(gulp.dest('dist'));
  }, done);
}));

gulp.task('rss', (done) => {
  const feed = new RSS(underhood.site);
  const authorsToPost = authors.filter((author) => author.post !== false);
  authorsToPost.forEach((author) => {
    const renderedFirstTweet = firstTweet(author);

    feed.item({
      title: author.username,
      description: render(renderedFirstTweet),
      url: `https://jsunderhood.ru/${author.authorId}/`,
      date: renderedFirstTweet ? renderedFirstTweet.created_at : null,
    });
  });

  output('dist/rss.xml', feed.xml({
    indent: true,
  }), done);
});

gulp.task('authors', gulp.series('css', (done) => {
  const authorsToPost = authors
    .filter((author) => author.tweets.length > 0)
    .filter((author) => author.post !== false);

  each(authorsToPost, (author) => gulp.src('./layouts/author.jade')
    .pipe(jade({
      pretty: true,
      locals: {
        title: `Неделя @${author.username} в @${underhood.underhood}`,
        author,
        underhood,
        helpers: {
          authorRender,
          bust,
        },
      },
    }))
    .pipe(rename({
      dirname: author.authorId,
      basename: 'index',
    }))
    .pipe(gulp.dest('./dist/')), done);
}));

gulp.task('userpics', () => {
  return gulp.src('dump/images/*-image*')
    .pipe(jimp({
      resize: {
        width: 96,
        height: 96,
      },
    }))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('current-userpic', () => {
  return head(authors) && gulp.src(`dump/images/${head(authors).authorId}-image*`)
    .pipe(jimp({
      resize: {
        width: 192,
        height: 192,
      },
    }))
    .pipe(rename('current-image'))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('current-banner', () => {
  return head(authors) && gulp.src(`dump/images/${head(authors).authorId}-banner*`)
    .pipe(rename('current-banner'))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('current-media', gulp.series(['current-userpic', 'current-banner']));

gulp.task('js', (done) => {
  webpack(webpackConfig, (err) => {
    if (err) throw new PluginError('webpack', err);
    done();
  });
});

gulp.task('static', () => {
  return gulp.src([
    'static/**',
    'static/.**',
    'node_modules/bootstrap/dist/**',
  ]).pipe(gulp.dest('dist'));
});

gulp.task('server', () => {
  const app = express();
  app.use(express.static('dist'));
  app.listen(4000);
  log('Server is running on http://localhost:4000');
});

/**
 * FLOW
 */
gulp.task('clean', (done) => {
  rimraf('dist', done);
});
gulp.task('html', gulp.series(['stats', 'authors', 'index', 'rss', 'md-pages']));
gulp.task('build', gulp.series('html', 'js', 'stats', 'static', 'userpics', 'current-media'));

gulp.task('watch', gulp.series(['build', 'server']), () => {
  watch(['**/*.jade'], () => gulp.start('html'));
  watch(['css/**/*.css'], () => gulp.start('css'));
  watch('js/**/*.js', () => gulp.start('js'));
  watch('static/**', () => gulp.start('static'));
});

gulp.task('default', gulp.series(['clean', 'watch']));
gulp.task('deploy', gulp.series(['build']), (done) => {
  buildbranch({
    branch: 'gh-pages',
    folder: 'dist',
  }, done);
});
