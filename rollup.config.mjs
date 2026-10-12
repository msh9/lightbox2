import terser from '@rollup/plugin-terser';

const input = 'src/js/lightbox.mjs';

export default [
  // For bundlers and <script type="module">.
  {
    input,
    output: {
      file: 'dist/js/lightbox.module.js',
      format: 'es'
    }
  },
  // For a plain <script> tag; exposes a global `lightbox`.
  {
    input,
    output: {
      file: 'dist/js/lightbox.min.js',
      format: 'iife',
      name: 'lightbox'
    },
    plugins: [terser()]
  }
];
