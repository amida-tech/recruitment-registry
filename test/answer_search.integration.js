/* global describe*/

'use strict';

process.env.NODE_ENV = 'test';

const searchCommon = require('./util/search/search-common');
const RRSuperTest = require('./util/rr-super-test');

describe('answer search integeration', function answerSearchUnit() {
    const rrSuperTest = new RRSuperTest();
    const tests = new searchCommon.IntegrationTests(rrSuperTest);
    tests.runAnswerSearchIntegration();
});
