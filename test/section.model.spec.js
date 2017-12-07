/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const sectionCommon = require('./util/section-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('section unit', function sectionUnit() {
    const hxSection = new History();
    const tests = new sectionCommon.SpecTests(generator, hxSection);

    before(shared.setUpFn());

    it('list all sections when none', function listSectionsWhenNone() {
        return models.section.listSections()
            .then((sections) => {
                expect(sections).to.have.length(0);
            });
    });

    _.range(5).forEach((index) => {
        it(`create section ${index}`, tests.createSectionFn());
        it(`get section ${index}`, tests.getSectionFn(index));
        it(`verify section ${index}`, tests.verifySectionFn(index));
    });

    it('list sections', tests.listSectionsFn(['id', 'name', 'description']));
    it('list sections (export)', tests.listSectionsFn(null, { scope: 'export' }));
});
