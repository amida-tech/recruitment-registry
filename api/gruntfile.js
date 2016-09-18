/*global module */

"use strict";

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-shell');

    const swaggerValidation = function () {
        var done = this.async();
        var spec = require('swagger-tools').specs.v2; // Using the latest Swagger 2.x specification
        var swaggerObject = require('./swagger.json'); // This assumes you're in the root of the swagger-tools
        spec.validate(swaggerObject, function (err, result) {
            if (err) {
                grunt.log.error(err);
                return done(false);
            }
            if (typeof result !== 'undefined') {
                if (result.errors.length > 0) {
                    grunt.log.error('The Swagger document is invalid...');
                    grunt.log.error('');
                    grunt.log.error('Errors');
                    grunt.log.error('------');
                    result.errors.forEach(function (err) {
                        grunt.log.error('#/' + err.path.join('/') + ': ' + err.message);
                    });
                    grunt.log.error('');
                }
                if (result.warnings.length > 0) {
                    grunt.log.writeln('Warnings');
                    grunt.log.writeln('--------');
                    result.warnings.forEach(function (warn) {
                        grunt.log.writeln('#/' + warn.path.join('/') + ': ' + warn.message);
                    });
                }
                if (result.errors.length > 0) {
                    return done(false);
                } else {
                    done();
                }
            } else {
                grunt.log.writeln('Swagger document is valid');
                return done();
            }
        });
    };

    grunt.initConfig({
        alljsfiles: ['**/*.js', '!node_modules/**/*.js', '!coverage/**/*.js', 'gruntfile.js', 'package.json', 'index.js', 'app.js'],
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
            //jshintrc: true
            options: {
                node: true,
                esversion: 6,
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
                expr: true,
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
                src: ['test/**/*.spec.js', 'test/**/*.integration.js']
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
    grunt.registerTask('swagger', 'Validates api definition', swaggerValidation);
    grunt.registerTask('default', ['beautify', 'jshint', 'swagger', 'mocha']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', function () {
        grunt.log.subhead(Date());
    });
};
