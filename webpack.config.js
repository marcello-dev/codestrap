// Copyright 2020 Marcello Monachesi
const path = require('path');
// Plugin to copy resources
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
      //popup: './src/popup.js',
      options: './src/options.js',
      //background: './src/background.js',
      contentscript: './src/contentscript.js'
    },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  plugins: [
    new CopyPlugin({ // Move resources to dist folder
      patterns: [
        { from: 'src/popup.html' },
        { from: 'src/options.html' },
        { from: 'src/manifest.json' },
        { from: 'src/popup.js'},
        { from: 'src/background.js'},
        { from: 'images', to: 'images',toType: 'dir',}
      ],
    }),
  ],
};