'use strict';

const swagger = require('../swagger.json');

const paths = Object.keys(swagger.paths);

paths.sort();

console.log(paths);
