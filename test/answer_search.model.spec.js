/* global describe*/

'use strict';

process.env.NODE_ENV = 'test';

const searchCommon = require('./util/search/search-common');

describe('answer search unit', function answerSearchUnit() {
    const tests = new searchCommon.SpecTests();
    tests.runAnswerSearchUnit();
});
