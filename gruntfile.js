/* global module */

'use strict';

const swaggerTools = require('swagger-tools');
const swaggerObject = require('./swagger.json');

module.exports = function gruntmain(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-eslint');

    const mochaBin = './node_modules/mocha/bin/_mocha';

    const swaggerValidation = function () {
        const done = this.async();
        const spec = swaggerTools.specs.v2;
        spec.validate(swaggerObject, (err, result) => {
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
                    result.errors.forEach((err2) => {
                        grunt.log.error(`#/${err2.path.join('/')}: ${err.message}`);
                    });
                    grunt.log.error('');
                }
                if (result.warnings.length > 0) {
                    grunt.log.writeln('Warnings');
                    grunt.log.writeln('--------');
                    result.warnings.forEach((warn) => {
                        grunt.log.writeln(`#/${warn.path.join('/')}: ${warn.message}`);
                    });
                }
                if (result.errors.length > 0) {
                    return done(false);
                }
                done();
            }
            grunt.log.writeln('Swagger document is valid');
            return done();
        });
    };

    grunt.initConfig({
        alljsfiles: [
            '**/*.js',
            '!node_modules/**/*.js',
            '!coverage/**/*.js',
            'gruntfile.js',
            'package.json',
            'index.js',
            'app.js',
        ],
        eslint: {
            options: {
                configFile: '.eslintrc.js',
                fix: true,
            },
            target: [
                '**/*.js',
                '!node_modules/**/*.js',
                '!coverage/**/*.js',
                'gruntfile.js',
                'index.js',
                'app.js',
                '.eslintrc.js',
                'test/.eslintrc.js',
            ],
        },
        watch: {
            all: {
                files: '<%= alljsfiles%>',
                tasks: ['default'],
            },
        },
        env: {
            test: {
                NODE_ENV: 'test',
            },
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    timeout: '10000',
                    bail: true,
                },
                src: ['test/**/*.spec.js', 'test/**/*.integration.js'],
            },
        },
        shell: {
            runIstanbul: {
                command: `istanbul cover ${mochaBin} -- -R spec --recursive -t 1000`,
            },
        },
    });

    grunt.registerTask('mocha', ['env:test', 'mochaTest']);
    grunt.registerTask('coverage', ['shell:runIstanbul']);
    grunt.registerTask('swagger', 'Validates api definition', swaggerValidation);
    grunt.registerTask('default', ['eslint', 'swagger', 'mocha']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', () => {
        grunt.log.subhead(Date());
    });
};
