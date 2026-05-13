/* eslint-env node */
const path = require('path');

// Mirrors the externals list from vortex-api/bin/webpack.js (which we can't
// require because vortex-api's package.json "exports" field locks down
// subpath access in Node 22+). Vortex provides these at runtime.
const VORTEX_EXTERNALS = [
  'bluebird',
  'electron',
  'exe-version',
  'ffi',
  'fs',
  'fs-extra',
  'fs-extra-promise',
  'immutability-helper',
  'lodash',
  'minimatch',
  'modmeta-db',
  'nbind',
  'net',
  'node-7z',
  'path',
  'react',
  'react-bootstrap',
  'react-dnd',
  'react-dnd-html5-backend',
  'react-dom',
  'react-i18next',
  'react-layout-pane',
  'react-redux',
  'react-select',
  'redux-act',
  'ref',
  'request',
  'semver',
  'semvish',
  'turbowalk',
  'util',
  'vortex-api',
  'vortex-parse-ini',
  'vortexmt',
  'winapi-bindings',
  'winston',
];

const externals = VORTEX_EXTERNALS.reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {});

module.exports = {
  mode: process.env.TARGET_ENV || 'development',
  target: 'electron-renderer',
  entry: path.join(__dirname, 'src', 'index.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
    sourceMapFilename: 'index.js.map',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: { configFile: 'tsconfig.build.json' },
      },
    ],
  },
  externals,
  node: { __filename: false, __dirname: false },
  devtool: 'source-map',
  stats: { errorDetails: true },
};
