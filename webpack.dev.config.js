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
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      },
       {
         test: /\.(png|svg|jpg|gif)$/,
         use: [
           'file-loader',
         ],
       },
    ],
  }
};