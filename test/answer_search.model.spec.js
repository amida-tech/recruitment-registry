/* global describe*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const searchCommon = require('./util/search/search-common');

const tests = new searchCommon.SpecTests();

describe('answer search unit', tests.answerSearchUnitFn());
