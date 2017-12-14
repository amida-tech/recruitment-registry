let gulp = require('gulp');
let plato = require('es6-plato');
let filename = require('./readAnalysisFile.js');;

let src = filename.includes('.js') ? `./${filename}` : `./${filename}/**`;

let outputDir = `./artifacts/${filename}`;

let lintRules = {
  'rules': {
    'indent': [2,'tab'],
    'quotes': [2,'single'],
    'semi': [2,'always'],
    'no-console' : [1],
    'curly': ['error'],
    'no-dupe-keys': 2,
    'func-names': [1, 'always']
  },
  'env': {
    'es6': true
  },
  'globals':['require'],
  'parserOptions' : {
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true,
      'modules': true
    }
  }
};


let complexityRules = {

};

let platoArgs = {
    title: 'Recruitment Registry Code Analysis',
    eslint: lintRules,
    complexity: complexityRules
};

function analysis() {
  if (src.includes('node_modules')) {
    return
  }
  return plato.inspect(src, outputDir, platoArgs);
}

gulp.task('analysis', analysis);
