'use strict';

const gulp = require('gulp');
const plato = require('es6-plato');
const lintRules = require('./.eslintrc.js');
const filename = require('./readAnalysisFile.js');

const src = filename.includes('.js') ? `./${filename}` : `./${filename}/**`;

const outputDir = `./artifacts/${filename}`;

const complexityRules = {};

const platoArgs = {
    title: 'Recruitment Registry Code Analysis',
    eslint: lintRules,
    complexity: complexityRules,
};

function analysis() {
    if (!src.includes('node_modules')) {
      plato.inspect(src, outputDir, platoArgs);
    }
}

gulp.task('analysis', analysis);
