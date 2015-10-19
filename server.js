
// Very simple server to serve static files on Heroku

delete process.env.BROWSER;

import path from 'path';
import fs from 'fs';

import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import Handlebars from 'handlebars';
import bloql from 'bloql/middleware/express';

import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import config from './webpack/dev.config';

const app = express();

let port = process.env.PORT || 3000;

bloql(app, {
  pretty: true,
  postsPath: path.join(__dirname, 'posts'),
  database: require('bloql-markdown-file-database')
});

// Enable Gzip
app.use(compression());

// Serve static cache with the expiry header
app.use(express.static('public', {
  maxAge: 365 * 24 * 60 * 60
}));

// Set default paths to assets
var assetsPaths = {
  js: 'index.js',
  css: 'style.css'
};

// Developemtn
if (process.env.NODE_ENV === 'development') {

  // Start webpack dev server

  const compiler = webpack(config);

  app.use(webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    contentBase: 'public',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  }));

  app.use(webpackHotMiddleware(compiler));

  // Set logger
  app.use(morgan('dev'));

} else {

  // Get assets path from file generated by Webpack
  var webpackAssets = require('./public/assets.json');
  assetsPaths = {
    js: webpackAssets.main.js,
    css: webpackAssets.main.css
  };

  // Set logger
  app.use(morgan('combined'));

}

app.use((req, res) => {

  // Generate Handlebars templates
  const indexTpl = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'src', 'index.hbs'), 'utf8'));

  // Respond to all request by the index
  res.end(indexTpl({
    jsPath: assetsPaths.js,
    cssPath: assetsPaths.css
  }));

});

app.listen(port, () => {
  console.log('Server started and listening on port ' + port);
});
