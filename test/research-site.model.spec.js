/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('research site unit', function () {
    const hxResearchSite = new History();

    before(shared.setUpFn());

    it('list all research sites when none', function () {
        return models.researchSite.listResearchSites()
            .then(researchSites => {
                expect(researchSites).to.have.length(0);
            });
    });

    const createResearchSiteFn = function () {
        return function () {
            const researchSite = generator.newResearchSite();
            return models.researchSite.createResearchSite(researchSite)
                .then(({ id }) => hxResearchSite.push(researchSite, { id }));
        };
    };

    const getResearchSiteFn = function (index) {
        return function () {
            const id = hxResearchSite.id(index);
            return models.researchSite.getResearchSite(id)
                .then(researchSite => {
                    hxResearchSite.updateServer(index, researchSite);
                    comparator.researchSite(hxResearchSite.client(index), researchSite);
                });
        };
    };

    const updateResearchSiteFn = function (index, fields) {
        return function () {
            const id = hxResearchSite.id(index);
            const patch = _.pick(generator.newResearchSite(), fields);
            return models.researchSite.patchResearchSite(id, patch)
                .then(() => Object.assign(hxResearchSite.server(index), patch));
        };
    };

    const verifyResearchSiteFn = function (index) {
        return function () {
            const expected = hxResearchSite.server(index);
            return models.researchSite.getResearchSite(expected.id)
                .then(researchSite => {
                    expect(researchSite).to.deep.equal(expected);
                });
        };
    };

    const listResearchSitesFn = function () {
        return function () {
            return models.researchSite.listResearchSites()
                .then(researchSites => {
                    let expected = _.cloneDeep(hxResearchSite.listServers());
                    expected = _.sortBy(expected, 'id');
                    expect(researchSites).to.deep.equal(expected);
                });
        };
    };

    const deleteResearchSiteFn = function (index) {
        return function () {
            const id = hxResearchSite.id(index);
            return models.researchSite.deleteResearchSite(id)
                .then(() => hxResearchSite.remove(index));
        };
    };

    _.range(10).forEach(index => {
        it(`create research site ${index}`, createResearchSiteFn());
        it(`get research site ${index}`, getResearchSiteFn(index));
        it(`update research site ${index}`, updateResearchSiteFn(index, ['name', 'state']));
        it(`verify research site ${index}`, verifyResearchSiteFn(index));
    });

    it('list research sites', listResearchSitesFn());

    [2, 5].forEach(index => {
        it(`delete research site ${index}`, deleteResearchSiteFn(index));
    });

    it('list research sites', listResearchSitesFn());
});
