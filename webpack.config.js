/* eslint-disable */

var production = process.env.NODE_ENV === 'production';

var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var htmlMinifiedOptions = {
  collapseWhitespace: true,
  removeRedundantAttributes: true
};

var htmlWebpackOptions = {
  minify: htmlMinifiedOptions,
  hash: true,
  template: 'src/index.html',
  inject: 'body'
};

var styleLoaders = [
  'css-loader',
  'postcss-loader',
  'sass-loader',
];

if (production) {
  styleLoaders.unshift('file-loader?name=[name].css', 'extract-loader');
} else {
  styleLoaders.unshift('style-loader');
}

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin(htmlWebpackOptions)
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'eslint-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: styleLoaders
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  devtool: "#inline-source-map"
};
