// Copyright 2020 Marcello Monachesi
const path = require('path');
// Plugin to copy resources
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
      popup: './src/popup.js',
      background: './src/background.js'
    },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  plugins: [
    new CopyPlugin({ // Move resources to dist folder without packing
      patterns: [
        { from: 'src/popup.html' },
        { from: 'src/manifest.json' },
        { from: 'images', to: 'images', toType: 'dir'}
      ],
    }),
  ],
};