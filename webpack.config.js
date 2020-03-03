const { join } = require('path');
const webpack = require('webpack');

// constants
const CWD = process.cwd();
const DEBUG = process.env.NODE_ENV !== 'production';
const DEST = 'dist';

// variables
const entry = [];
const rules = [];
const plugins = [];

// entry points
entry.push('./js');

rules.push({
  test: /\.js$/,
  exclude: /node_modules/,
  use: ['babel-loader'],
});

rules.push({
  test: /\.json$/,
  use: ['json-loader'],
});

plugins.push(new webpack.ContextReplacementPlugin(/moment\/locale$/, /ru/));

if (!DEBUG) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
    }),
  );
  plugins.push(
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') },
    }),
  );
  plugins.push(new webpack.NoErrorsPlugin());
}

// configuration
module.exports = {
  entry,
  mode: DEBUG ? 'development' : 'production',
  cache: DEBUG,
  devtool: DEBUG ? 'source-map' : 'hidden-source-map',
  output: {
    path: join(CWD, DEST),
    publicPath: '/',
    filename: 'app.js',
    pathinfo: DEBUG,
  },
  module: { rules },
  plugins,
};
