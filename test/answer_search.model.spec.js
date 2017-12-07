/* global describe */

'use strict';

process.env.NODE_ENV = 'test';

const searchCommon = require('./util/search/search-common');

const tests = new searchCommon.SpecTests();

describe('answer search unit', tests.answerSearchUnitFn());
