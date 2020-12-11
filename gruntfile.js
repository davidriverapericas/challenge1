module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            uikit: {
                options: {
                    sourcemap: 'none'
                },
                files: {
                    'assets/css/uikit/uikit.css': [
                        'src/sass/uikit/{,*/}*.sass'
                    ]
                }
            }
        },
        cssmin: {
            uikit: {
                files: {
                    'assets/css/uikit.min.css': [
                        'assets/css/uikit.css'
                    ]
                }
            }
        },
        uglify: {
            options: {
                mangle: true,
                compress: true
            },
            applib: {
                src: [
                    'src/js/uikit/**.js',
                ],
                dest: 'assets/js/uikit/uikit.min.js'
            }
        },
        copy: {
            uikit: {
                files: [{
                    expand: true,
                    cwd: 'src/img/uikit/',
                    src: '**',
                    dest: 'assets/img/uikit/'
                }],
            },
        },
        watch: {
            sass: {
                files: ['src/sass/{,*/}*.sass'],
                tasks: ['sass:uikit'],
                /* , 'cssmin:uikit' */
                options: {
                    spawn: false
                }
            },
            uglify: {
                files: ['src/js/{,*/}*.js'],
                tasks: ['uglify']
            },
            copy: {
                files: ['src/img/uikit/**'],
                tasks: ['copy:uikit']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['sass:uikit', 'copy:uikit', /*'cssmin:uikit',*/ 'uglify', 'watch']);
};