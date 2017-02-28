/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');

const zipUtil = require('../lib/zip-util');
const SPromise = require('../lib/promise');

const SharedIntegration = require('./util/shared-integration.js');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const researchSiteCommon = require('./util/research-site-common');
const config = require('../config');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('research site integration', function () {
    const rrSuperTest = new RRSuperTest();
    const hxResearchSite = new History();

    before(shared.setUpFn(rrSuperTest));

    const researchZipCodes = researchSiteCommon.getResearchSiteZips();

    it('set up zip utilities', function () {
        sinon.stub(zipUtil, 'findVicinity', function (zip) {
            const vicinity = researchSiteCommon.findVicinity(zip);
            return SPromise.resolve(vicinity);
        });
    });

    it('list all research sites when none', function (done) {
        rrSuperTest.get('/research-sites', false, 200)
            .expect(function (res) {
                expect(res.body).to.have.length(0);
            })
            .end(done);
    });

    const createResearchSiteFn = function (index, actualZipCode) {
        return function (done) {
            const zip = actualZipCode || researchZipCodes[index];
            const researchSite = generator.newResearchSite(zip);
            rrSuperTest.post('/research-sites', researchSite, 201)
                .expect(function (res) {
                    hxResearchSite.push(researchSite, res.body);
                })
                .end(done);
        };
    };

    const getResearchSiteFn = function (index) {
        return function (done) {
            const id = hxResearchSite.id(index);
            rrSuperTest.get(`/research-sites/${id}`, true, 200)
                .expect(function (res) {
                    hxResearchSite.updateServer(index, res.body);
                    comparator.researchSite(hxResearchSite.client(index), res.body);
                })
                .end(done);
        };
    };

    const updateResearchSiteFn = function (index, fields) {
        return function (done) {
            const id = hxResearchSite.id(index);
            if ('zip' in fields) {
                throw new Error('Zip cannot be specified');
            }
            const patch = _.pick(generator.newResearchSite('00000'), fields);
            rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
                .expect(function () {
                    Object.assign(hxResearchSite.server(index), patch);
                })
                .end(done);
        };
    };

    const verifyResearchSiteFn = function (index) {
        return function (done) {
            const expected = hxResearchSite.server(index);
            rrSuperTest.get(`/research-sites/${expected.id}`, true, 200)
                .expect(function (res) {
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listResearchSitesFn = function () {
        return function (done) {
            rrSuperTest.get('/research-sites', true, 200)
                .expect(function (res) {
                    let expected = _.cloneDeep(hxResearchSite.listServers());
                    expected = _.sortBy(expected, 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const deleteResearchSiteFn = function (index) {
        return function (done) {
            const id = hxResearchSite.id(index);
            rrSuperTest.delete(`/research-sites/${id}`, 204)
                .expect(function () {
                    hxResearchSite.remove(index);
                })
                .end(done);
        };
    };

    _.range(10).forEach(index => {
        it('login as super', shared.loginFn(rrSuperTest, config.superUser));
        it(`create research site ${index}`, createResearchSiteFn(index));
        it('logout as super', shared.logoutFn(rrSuperTest));
        it(`get research site ${index}`, getResearchSiteFn(index));
        it('login as super', shared.loginFn(rrSuperTest, config.superUser));
        it(`update research site ${index}`, updateResearchSiteFn(index, ['name', 'state']));
        it('logout as super', shared.logoutFn(rrSuperTest));
        it(`verify research site ${index}`, verifyResearchSiteFn(index));
    });

    it('list research sites', listResearchSitesFn());

    const verifyNearbyFn = function (zipCode) {
        return function (done) {
            rrSuperTest.get('/research-sites', true, 200, { 'near-zip': zipCode })
                .expect(function (res) {
                    const nearbyZipCodes = researchSiteCommon.findNear(zipCode);
                    const nearResearchSiteSet = new Set(nearbyZipCodes);
                    let expected = hxResearchSite.listServers().filter(({ zip }) => nearResearchSiteSet.has(zip));
                    expected = _.sortBy(expected, 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const exampleZipCodes = researchSiteCommon.exampleZipCodes;

    exampleZipCodes.forEach(zipCode => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));
    [2, 5].forEach(index => {
        it(`delete research site ${index}`, deleteResearchSiteFn(index));
    });
    it('logout as super', shared.logoutFn(rrSuperTest));

    it('list research sites', listResearchSitesFn());

    exampleZipCodes.forEach(zipCode => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));
    it('update zip code for research site 0', function (done) {
        const id = hxResearchSite.id(0);
        const patch = { zip: '88888' };
        rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
            .expect(function () {
                Object.assign(hxResearchSite.server(0), patch);
            })
            .end(done);
    });
    it('logout as super', shared.logoutFn(rrSuperTest));

    it('verify update was successfull', function (done) {
        rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '80001' })
            .expect(function (res) {
                const expected = [hxResearchSite.server(0)];
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    exampleZipCodes.forEach(zipCode => {
        it(`find nearby research sites for ${zipCode} after update`, verifyNearbyFn(zipCode));
    });

    const createResearchSiteVicinityFn = function (index, zipCodes) {
        return function (done) {
            const id = hxResearchSite.id(index);
            rrSuperTest.post(`/research-sites/${id}/vicinities`, { zipCodes }, 204).end(done);
        };
    };

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));
    [
        [0, ['50001', '50002', '50003']],
        [1, ['50002', '50003', '50004']],
        [3, ['50003', '50004', '50005']]
    ].forEach(([index, zipCodes]) => {
        it(`manually set nearby zip codes for reesearch site ${index}`, createResearchSiteVicinityFn(index, zipCodes));
    });
    it('logout as super', shared.logoutFn(rrSuperTest));

    const verifyNearbyIndicesFn = function (zipCode, indices) {
        return function (done) {
            rrSuperTest.get('/research-sites', true, 200, { 'near-zip': zipCode })
                .expect(function (res) {
                    let expected = hxResearchSite.listServers(undefined, indices);
                    expected = _.sortBy(expected, 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    [
        ['50001', [0]],
        ['50002', [0, 1]],
        ['50003', [0, 1, 3]],
        ['50004', [1, 3]]
    ].forEach(([zipCode, indices]) => {
        it(`verify manually set zip codes ${zipCode}`, verifyNearbyIndicesFn(zipCode, indices));
    });

    it('release zip utilities', function () {
        zipUtil.findVicinity.restore();
    });

    ////++ to be run by real api key and real zip code (Boston area)
    //it('login as super', shared.loginFn(rrSuperTest, config.superUser));
    //it('create research site with actual zip code 02118', createResearchSiteFn(undefined, '02118'));
    //it('get research site with actual zip code 02118', getResearchSiteFn(10));
    //it('create research site with actual zip code 02446', createResearchSiteFn(undefined, '02446'));
    //it('get research site with actual zip code 02446', getResearchSiteFn(11));
    //it('make sure to get for a nearby zip code', function (done) {
    //    rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '02151' })
    //        .expect(function (res) {
    //            const nearResearchSiteSet = new Set(['02118', '02446']);
    //            let expected = hxResearchSite.listServers().filter(({ zip }) => nearResearchSiteSet.has(zip));
    //            expected = _.sortBy(expected, 'id');
    //            expect(res.body).to.deep.equal(expected);
    //        })
    //        .end(done);
    //});
    //// switch to washington area
    //it('update zip code for research site 0', function (done) {
    //    const id = hxResearchSite.id(10);
    //    const patch = { zip: '20850' };
    //    rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
    //        .expect(function () {
    //            Object.assign(hxResearchSite.server(10), patch);
    //        })
    //        .end(done);
    //});
    //it('update zip code for research site 11', function (done) {
    //    const id = hxResearchSite.id(11);
    //    const patch = { zip: '20852' };
    //    rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
    //        .expect(function () {
    //            Object.assign(hxResearchSite.server(11), patch);
    //        })
    //        .end(done);
    //});
    //it('make sure to get for a nearby zip code', function (done) {
    //    rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '20816' })
    //        .expect(function (res) {
    //            const nearResearchSiteSet = new Set(['20852', '20850']);
    //            let expected = hxResearchSite.listServers().filter(({ zip }) => nearResearchSiteSet.has(zip));
    //            expected = _.sortBy(expected, 'id');
    //            expect(res.body).to.deep.equal(expected);
    //        })
    //        .end(done);
    //});
    //it('logout as super', shared.logoutFn(rrSuperTest));
});
