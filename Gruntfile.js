module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      dist: {
        src: ['bower_components/jquery/dist/jquery.js', 'src/js/lightbox.js'],
        dest: 'dist/js/lightbox-plus-jquery.js',
      },
    },
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['**'],
            dest: 'dist/'
          }
        ],
      },
    },
    uglify: {
      options: {
        preserveComments: 'some',
        sourceMap: true
      },
      dist: {
        files: {
          'dist/js/lightbox.min.js': ['src/js/lightbox.js'],
          'dist/js/lightbox-plus-jquery.min.js': ['dist/js/lightbox-plus-jquery.js']
        }
      }
    },
    watch: {
      jshint: {
        files: ['src/js/lightbox.js'],
        tasks: ['jshint', 'jscs']
      }
    },
    cssmin: {
      minify: {
          src: 'dist/css/lightbox.css',
          dest: 'dist/css/lightbox.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['connect', 'watch']);
  grunt.registerTask('build', ['copy:dist', 'concat', 'uglify', 'cssmin:minify']);
};
