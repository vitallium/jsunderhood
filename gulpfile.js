const rimraf = require('rimraf');
const each = require('each-done');
const express = require('express');
const fs = require('fs');
const { outputFile } = require('fs-extra');
const { html } = require('commonmark-helpers');
const numbers = require('typographic-numbers');
const numd = require('numd');
const RSS = require('rss');
const { merge, pipe, prop, head, splitEvery } = require('ramda');
const renderTweet = require('tweet.md');
const autoprefixer = require('autoprefixer');
const pcssImport = require('postcss-import');
const pcssInitial = require('postcss-initial');
const webpackStream = require('webpack-stream');
const imagemin = require('gulp-imagemin');
const gulp = require('gulp');
const gulpPug = require('gulp-pug');
const rename = require('gulp-rename');
const watch = require('gulp-watch');
const jimp = require('gulp-jimp');
const postcss = require('gulp-postcss');

const articleData = require('article-data');
const getStats = require('./stats');
const underhood = require('./.underhoodrc.json');
const webpackConfig = require('./webpack.config');

const authorRender = require('./helpers/author-render');
const bust = require('./helpers/bust');
const lastUpdated = require('./helpers/last-updated');

const authors = require('./dump');

const latestInfo = (head(authors) || {}).info;

const pugDefaults = {
  pretty: true,
  locals: {
    site: underhood.site,
    latestInfo,
    numbers: input =>
      numbers(input, {
        locale: 'ru',
      }),
    people: numd('человек', 'человека', 'человек'),
  },
};

const getOptions = (opts = {}) => {
  const locals = {
    ...pugDefaults.locals,
    ...opts.locals,
  };

  return {
    ...pugDefaults,
    opts,
    locals,
  };
};

const pug = opts => gulpPug(getOptions(opts));
const firstTweet = pipe(prop('tweets'), head);
const render = pipe(renderTweet, html);

/**
 * MAIN TASKS
 */
gulp.task('css', () => {
  return gulp
    .src('css/styles.css')
    .pipe(postcss([pcssImport, pcssInitial, autoprefixer]))
    .pipe(gulp.dest('./dist/css/'));
});

gulp.task(
  'index',
  gulp.series('css', () => {
    const authorsToPost = authors.filter(author => author.post !== false);

    return gulp
      .src('layouts/index.pug')
      .pipe(
        pug({
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
        }),
      )
      .pipe(
        rename({
          basename: 'index',
        }),
      )
      .pipe(gulp.dest('./dist/'));
  }),
);

gulp.task(
  'stats',
  gulp.series('css', () => {
    return gulp
      .src('./layouts/stats.pug')
      .pipe(
        pug({
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
        }),
      )
      .pipe(
        rename({
          dirname: 'stats',
          basename: 'index',
        }),
      )
      .pipe(gulp.dest('./dist/'));
  }),
);

gulp.task(
  'md-pages',
  gulp.series('css', done => {
    each(
      [
        {
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
      ],
      item => {
        const page = fs.readFileSync(`./pages/${item.name}.md`, {
          encoding: 'utf8',
        });
        // TODO change to 'ru' after moment/moment#2634 will be published
        const article = articleData(page, 'D MMMM YYYY', 'en');
        return gulp
          .src('layouts/article.pug')
          .pipe(
            pug({
              locals: merge(article, {
                title: item.title,
                url: `${item.name}/`,
                underhood,
                helpers: {
                  bust,
                },
              }),
            }),
          )
          .pipe(
            rename({
              dirname: item.name,
              basename: 'index',
            }),
          )
          .pipe(gulp.dest('dist'));
      },
      done,
    );
  }),
);

gulp.task('rss', done => {
  const feed = new RSS(underhood.site);
  const authorsToPost = authors.filter(author => author.post !== false);
  authorsToPost.forEach(author => {
    const renderedFirstTweet = firstTweet(author);

    feed.item({
      title: author.username,
      description: render(renderedFirstTweet),
      url: `https://jsunderhood.ru/${author.authorId}/`,
      date: renderedFirstTweet ? renderedFirstTweet.created_at : null,
    });
  });

  outputFile(
    'dist/rss.xml',
    feed.xml({
      indent: true,
    }),
    done,
  );
});

gulp.task(
  'authors',
  gulp.series('css', done => {
    const authorsToPost = authors
      .filter(author => author.tweets.length > 0)
      .filter(author => author.post !== false);

    each(
      authorsToPost,
      author =>
        gulp
          .src('./layouts/author.pug')
          .pipe(
            pug({
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
            }),
          )
          .pipe(
            rename({
              dirname: author.authorId,
              basename: 'index',
            }),
          )
          .pipe(gulp.dest('./dist/')),
      done,
    );
  }),
);

gulp.task('userpics', () => {
  return gulp
    .src('dump/images/*-image*')
    .pipe(
      jimp({
        resize: {
          width: 96,
          height: 96,
        },
      }),
      imagemin(),
    )
    .pipe(gulp.dest('dist/images'));
});

gulp.task('current-userpic', () => {
  return (
    head(authors) &&
    gulp
      .src(`dump/images/${head(authors).authorId}-image*`)
      .pipe(
        jimp({
          resize: {
            width: 192,
            height: 192,
          },
        }),
        imagemin(),
      )
      .pipe(rename('current-image'))
      .pipe(gulp.dest('dist/images'))
  );
});

gulp.task('current-banner', () => {
  return (
    head(authors) &&
    gulp
      .src(`dump/images/${head(authors).authorId}-banner*`)
      .pipe(rename('current-banner'))
      .pipe(gulp.dest('dist/images'))
  );
});

gulp.task('current-media', gulp.series(['current-userpic', 'current-banner']));

gulp.task('js', () => {
  return webpackStream(webpackConfig).pipe(gulp.dest('dist'));
});

gulp.task('static', () => {
  return gulp
    .src(['static/**', 'static/.**', 'node_modules/bootstrap/dist/**'])
    .pipe(gulp.dest('dist'));
});

gulp.task('server', () => {
  const app = express();
  app.use(express.static('dist'));
  app.listen(4000);

  // eslint-disable-next-line no-console
  console.log('Server is running on http://localhost:4000');
});

/**
 * FLOW
 */
gulp.task('clean', done => {
  rimraf('dist', done);
});
gulp.task('html', gulp.series(['stats', 'authors', 'index', 'rss', 'md-pages']));
gulp.task('build', gulp.series('html', 'js', 'stats', 'static', 'userpics', 'current-media'));

gulp.task('watch', gulp.series(['build', 'server']), () => {
  watch(['**/*.pug'], () => gulp.start('html'));
  watch(['css/**/*.css'], () => gulp.start('css'));
  watch('js/**/*.js', () => gulp.start('js'));
  watch('static/**', () => gulp.start('static'));
});

gulp.task('default', gulp.series(['clean', 'watch']));
