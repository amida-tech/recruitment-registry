/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');

const models = require('../models');
const zipUtil = require('../lib/zip-util');
const SPromise = require('../lib/promise');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const researchSiteCommon = require('./util/research-site-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('research site unit', () => {
    const hxResearchSite = new History();

    before(shared.setUpFn());

    const researchZipCodes = researchSiteCommon.getResearchSiteZips();

    it('set up zip utilities', () => {
        sinon.stub(zipUtil, 'findVicinity', (zip) => {
            const vicinity = researchSiteCommon.findVicinity(zip);
            return SPromise.resolve(vicinity);
        });
    });

    it('list all research sites when none', () => models.researchSite.listResearchSites()
            .then((researchSites) => {
                expect(researchSites).to.have.length(0);
            }));

    const createResearchSiteFn = function (index) {
        return function () {
            const zip = researchZipCodes[index];
            const researchSite = generator.newResearchSite(zip);
            return models.researchSite.createResearchSite(researchSite)
                .then(({ id }) => hxResearchSite.push(researchSite, { id }));
        };
    };

    const getResearchSiteFn = function (index) {
        return function () {
            const id = hxResearchSite.id(index);
            return models.researchSite.getResearchSite(id)
                .then((researchSite) => {
                    hxResearchSite.updateServer(index, researchSite);
                    comparator.researchSite(hxResearchSite.client(index), researchSite);
                });
        };
    };

    const updateResearchSiteFn = function (index, fields) {
        return function () {
            const id = hxResearchSite.id(index);
            if ('zip' in fields) {
                throw new Error('Zip cannot be specified');
            }
            const patch = _.pick(generator.newResearchSite('00000'), fields);
            return models.researchSite.patchResearchSite(id, patch)
                .then(() => Object.assign(hxResearchSite.server(index), patch));
        };
    };

    const verifyResearchSiteFn = function (index) {
        return function () {
            const expected = hxResearchSite.server(index);
            return models.researchSite.getResearchSite(expected.id)
                .then((researchSite) => {
                    expect(researchSite).to.deep.equal(expected);
                });
        };
    };

    const listResearchSitesFn = function () {
        return function () {
            return models.researchSite.listResearchSites()
                .then((researchSites) => {
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

    _.range(10).forEach((index) => {
        it(`create research site ${index}`, createResearchSiteFn(index));
        it(`get research site ${index}`, getResearchSiteFn(index));
        it(`update all research site meta fields ${index}`, updateResearchSiteFn(index, ['name', 'url', 'street', 'city', 'state']));
        it(`verify research site ${index}`, verifyResearchSiteFn(index));
    });

    it('list research sites', listResearchSitesFn());

    const verifyNearbyFn = function (zipCode) {
        return function () {
            return models.researchSite.listResearchSites({ nearZip: zipCode })
                .then((result) => {
                    const nearbyZipCodes = researchSiteCommon.findNear(zipCode);
                    const nearResearchSiteSet = new Set(nearbyZipCodes);
                    let expected = hxResearchSite.listServers().filter(({ zip }) => nearResearchSiteSet.has(zip));
                    expected = _.sortBy(expected, 'id');
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const exampleZipCodes = researchSiteCommon.exampleZipCodes;

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    [2, 5].forEach((index) => {
        it(`delete research site ${index}`, deleteResearchSiteFn(index));
    });

    it('list research sites', listResearchSitesFn());

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    it('update zip code for research site 0', () => {
        const id = hxResearchSite.id(0);
        const patch = { zip: '88888' };
        return models.researchSite.patchResearchSite(id, patch)
            .then(() => Object.assign(hxResearchSite.server(0), patch));
    });

    it('verify update was successfull', () => models.researchSite.listResearchSites({ nearZip: '80001' })
            .then((sites) => {
                const expected = [hxResearchSite.server(0)];
                expect(sites).to.deep.equal(expected);
            }));

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode} after update`, verifyNearbyFn(zipCode));
    });

    const createResearchSiteVicinityFn = function (index, zipCodes) {
        return function () {
            const id = hxResearchSite.id(index);
            return models.researchSite.createResearchSiteVicinity(id, zipCodes);
        };
    };

    [
        [0, ['50001', '50002', '50003']],
        [1, ['50002', '50003', '50004']],
        [3, ['50003', '50004', '50005']],
    ].forEach(([index, zipCodes]) => {
        it(`manually set nearby zip codes for reesearch site ${index}`, createResearchSiteVicinityFn(index, zipCodes));
    });

    const verifyNearbyIndicesFn = function (zipCode, indices) {
        return function () {
            return models.researchSite.listResearchSites({ nearZip: zipCode })
                .then((result) => {
                    let expected = hxResearchSite.listServers(undefined, indices);
                    expected = _.sortBy(expected, 'id');
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    [
        ['50001', [0]],
        ['50002', [0, 1]],
        ['50003', [0, 1, 3]],
        ['50004', [1, 3]],
    ].forEach(([zipCode, indices]) => {
        it(`verify manually set zip codes ${zipCode}`, verifyNearbyIndicesFn(zipCode, indices));
    });

    it('release zip utilities', () => {
        zipUtil.findVicinity.restore();
    });
});
