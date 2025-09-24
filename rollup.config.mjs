import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/js/lightbox.mjs',
    output: {
      file: 'dist/js/lightbox-jquery.js',
      format: 'umd',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()]
  },
  {
    input: 'src/js/lightbox.mjs',
    output: {
      file: 'dist/js/lightbox-jquery.min.js',
      format: 'umd',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs(), terser()]
  },
  {
    input: 'src/js/lightbox.mjs',
    external: ['jquery'],
    output: {
      file: 'dist/js/lightbox.module.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()]
  },
  {
    input: 'src/js/lightbox.mjs',
    output: {
      file: 'dist/js/lightbox-jquery.module.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs()]
  },
  {
    input: 'src/js/lightbox.mjs',
    output: {
      file: 'dist/js/lightbox-jquery.module.min.js',
      format: 'es',
      name: 'lightbox'
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];
