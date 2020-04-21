const path = require('path');
var webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    game: './src/client/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    globalObject: "this"
  }
};