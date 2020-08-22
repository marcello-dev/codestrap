// Copyright 2020 Marcello Monachesi
const path = require('path');
// Plugin to copy resources
const CopyPlugin = require('copy-webpack-plugin');
// Enable to add vendor-specific styles to the Sass files
const autoprefixer = require('autoprefixer');

module.exports = {
  entry: {
      popup: './src/popup.js',
      background: './src/background.js',
      entry: './src/app.scss'
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

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'bundle.css',
            },
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
               plugins: () => [autoprefixer()]
            }
          },
          {
            loader: 'sass-loader',
            options: {
              // Prefer Dart Sass
              implementation: require('sass'),
          
              // See https://github.com/webpack-contrib/sass-loader/issues/804
              webpackImporter: false,
              sassOptions: {
                includePaths: ['./node_modules']
              },
            }
          },
        ]
      }
    ]
  },

};