const resolve = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = [
  {
    input: 'src/js/lightbox.js',
    output: {
      file: 'dist/js/lightbox-jquery.js',
      format: 'iife',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: 'src/js/lightbox.js',
    output: {
      file: 'dist/js/lightbox-jquery.min.js',
      format: 'iife',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs(), terser()]
  },
  {
    input: 'src/js/lightbox.js',
    external: ['jquery'],
    output: {
      file: 'dist/js/lightbox.module.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: 'src/js/lightbox.js',
    output: {
      file: 'dist/js/lightbox-jquery.module.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: 'src/js/lightbox.js',
    output: {
      file: 'dist/js/lightbox-jquery.module.min.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs(), terser()]
  },
];