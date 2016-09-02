/*global module */

"use strict";

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-shell');

    grunt.initConfig({
        alljsfiles: ['api/**/*.js', 'test/**/*.js', 'gruntfile.js', 'package.json', 'index.js', 'app.js'],
        jsbeautifier: {
            beautify: {
                src: '<%= alljsfiles%>',
                options: {
                    config: '.jsbeautifyrc'
                }
            },
            check: {
                src: '<%= alljsfiles%>',
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '.jsbeautifyrc'
                }
            }
        },
        jshint: {
            files: '<%= alljsfiles%>',
            options: {
                browser: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: false,
                boss: true,
                eqnull: true,
                node: true,
                expr: true,
                esversion: 6,
                globals: {
                    'xit': true,
                    'xdescribe': true,
                    'it': true,
                    'describe': true,
                    'before': true,
                    'after': true,
                    'done': true
                }
            }
        },
        watch: {
            all: {
                files: '<%= alljsfiles%>',
                tasks: ['default']
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    timeout: '1000',
                    bail: true
                },
                src: ['test/**/*.spec.js', 'test/scenerios/*.js']
            }
        },
        shell: {
            run_istanbul: {
                command: "istanbul cover ./node_modules/mocha/bin/_mocha -- -R spec --recursive -t 1000"
            }
        }
    });

    grunt.registerTask('beautify', ['jsbeautifier:beautify']);
    grunt.registerTask('mocha', ['mochaTest']);
    grunt.registerTask('coverage', ['shell:run_istanbul']);
    grunt.registerTask('default', ['beautify', 'jshint', 'mocha']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', function () {
        grunt.log.subhead(Date());
    });
};
