// Copyright 2020 Marcello Monachesi
const path = require('path');

module.exports = {
  entry: {
      popup: './src/popup.js',
      options: './src/options.js',
      background: './src/background.js',
      contentscript: './src/contentscript.js'
    },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};