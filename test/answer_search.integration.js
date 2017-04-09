/* global describe*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const searchCommon = require('./util/search/search-common');
const RRSuperTest = require('./util/rr-super-test');

const rrSuperTest = new RRSuperTest();
const tests = new searchCommon.IntegrationTests(rrSuperTest);

describe('answer search unit', tests.answerSearchIntegrationFn());
