const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/renderer/index.tsx',
  target: 'web', // Changed from 'electron-renderer' to 'web'
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false,
      "crypto": false,
      "util": false,
      "assert": false,
      "os": false
    }
  },
  externals: {
    'electron': 'commonjs electron'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
      inject: false // Don't auto-inject the script tag since we're doing it manually
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({}),
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:8080/api/v1')
    })
  ]
};