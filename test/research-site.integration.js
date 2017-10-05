/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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

describe('research site integration', () => {
    const rrSuperTest = new RRSuperTest();
    const hxResearchSite = new History();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    before(shared.setUpFn());

    const researchZipCodes = researchSiteCommon.getResearchSiteZips();

    it('set up zip utilities', () => {
        sinon.stub(zipUtil, 'findVicinity', (zip) => {
            const vicinity = researchSiteCommon.findVicinity(zip);
            return SPromise.resolve(vicinity);
        });
    });

    it('list all research sites when none', (done) => {
        rrSuperTest.get('/research-sites', false, 200)
            .expect((res) => {
                expect(res.body).to.have.length(0);
            })
            .end(done);
    });

    const createResearchSiteFn = function (index, actualZipCode, hasOptionalFields) {
        return (done) => {
            const zip = actualZipCode || researchZipCodes[index];
            const researchSite = generator.newResearchSite(zip, hasOptionalFields);
            rrSuperTest.post('/research-sites', researchSite, 201)
                .expect((res) => {
                    hxResearchSite.push(researchSite, res.body);
                })
                .end(done);
        };
    };

    const getResearchSiteFn = function (index) {
        return (done) => {
            const id = hxResearchSite.id(index);
            rrSuperTest.get(`/research-sites/${id}`, true, 200)
                .expect((res) => {
                    hxResearchSite.updateServer(index, res.body);
                    comparator.researchSite(hxResearchSite.client(index), res.body);
                })
                .end(done);
        };
    };

    const updateResearchSiteFn = function (index, fields, hasOptionalFields) {
        return (done) => {
            const id = hxResearchSite.id(index);
            if ('zip' in fields) {
                throw new Error('Zip cannot be specified');
            }
            const patch = _.pick(generator.newResearchSite('00000', hasOptionalFields), fields);
            rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
                .expect(() => {
                    Object.assign(hxResearchSite.server(index), patch);
                })
                .end(done);
        };
    };

    const verifyResearchSiteFn = function (index) {
        return (done) => {
            const expected = hxResearchSite.server(index);
            rrSuperTest.get(`/research-sites/${expected.id}`, true, 200)
                .expect((res) => {
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listResearchSitesFn = function () {
        return (done) => {
            rrSuperTest.get('/research-sites', true, 200)
                .expect((res) => {
                    let expected = _.cloneDeep(hxResearchSite.listServers());
                    expected = _.sortBy(expected, 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const deleteResearchSiteFn = function (index) {
        return (done) => {
            const id = hxResearchSite.id(index);
            rrSuperTest.delete(`/research-sites/${id}`, 204)
                .expect(() => {
                    hxResearchSite.remove(index);
                })
                .end(done);
        };
    };

    _.range(10).forEach((index) => {
        if (index % 2 === 0) {
            it('login as super', shared.loginFn(config.superUser));
            it(`create research site ${index}`, createResearchSiteFn(index, undefined, true));
            it('logout as super', shared.logoutFn());
            it(`get research site ${index}`, getResearchSiteFn(index));
            it('login as super', shared.loginFn(config.superUser));
            it(`update some research site meta fields ${index}`, updateResearchSiteFn(index, ['name', 'state']));
            it(`update all research site meta fields ${index}`, updateResearchSiteFn(index, ['name', 'phone', 'ext', 'phone2', 'ext2', 'url', 'street', 'street2', 'city', 'state'], true));
            it('logout as super', shared.logoutFn());
            it(`verify research site ${index}`, verifyResearchSiteFn(index));
        } else {
            it('login as super', shared.loginFn(config.superUser));
            it(`create research site ${index}`, createResearchSiteFn(index, undefined, false));
            it('logout as super', shared.logoutFn());
            it(`get research site ${index}`, getResearchSiteFn(index));
            it('login as super', shared.loginFn(config.superUser));
            it(`update some research site meta fields ${index}`, updateResearchSiteFn(index, ['name', 'state']));
            it(`update all research site meta fields ${index}`, updateResearchSiteFn(index, ['name', 'phone', 'url', 'street', 'city', 'state'], false));
            it('logout as super', shared.logoutFn());
            it(`verify research site ${index}`, verifyResearchSiteFn(index));
        }
    });

    it('list research sites', listResearchSitesFn());

    const verifyNearbyFn = function (zipCode) {
        return (done) => {
            rrSuperTest.get('/research-sites', true, 200, { 'near-zip': zipCode })
                .expect((res) => {
                    const nearbyZipCodes = researchSiteCommon.findNear(zipCode);
                    const nearResearchSiteSet = new Set(nearbyZipCodes);
                    let expected = hxResearchSite.listServers()
                        .filter(({ zip }) => nearResearchSiteSet.has(zip));
                    expected = _.sortBy(expected, 'id');
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const exampleZipCodes = researchSiteCommon.exampleZipCodes;

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    it('login as super', shared.loginFn(config.superUser));
    [2, 5].forEach((index) => {
        it(`delete research site ${index}`, deleteResearchSiteFn(index));
    });
    it('logout as super', shared.logoutFn());

    it('list research sites', listResearchSitesFn());

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode}`, verifyNearbyFn(zipCode));
    });

    it('login as super', shared.loginFn(config.superUser));
    it('update zip code for research site 0', (done) => {
        const id = hxResearchSite.id(0);
        const patch = { zip: '88888' };
        rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
            .expect(() => {
                Object.assign(hxResearchSite.server(0), patch);
            })
            .end(done);
    });
    it('logout as super', shared.logoutFn());

    it('verify update was successfull', (done) => {
        rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '80001' })
            .expect((res) => {
                const expected = [hxResearchSite.server(0)];
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    exampleZipCodes.forEach((zipCode) => {
        it(`find nearby research sites for ${zipCode} after update`, verifyNearbyFn(zipCode));
    });

    const createResearchSiteVicinityFn = function (index, zipCodes) {
        return (done) => {
            const id = hxResearchSite.id(index);
            rrSuperTest.post(`/research-sites/${id}/vicinities`, { zipCodes }, 204).end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));
    [
        [0, ['50001', '50002', '50003']],
        [1, ['50002', '50003', '50004']],
        [3, ['50003', '50004', '50005']],
    ].forEach(([index, zipCodes]) => {
        it(`manually set nearby zip codes for reesearch site ${index}`, createResearchSiteVicinityFn(index, zipCodes));
    });
    it('logout as super', shared.logoutFn());

    const verifyNearbyIndicesFn = function (zipCode, indices) {
        return (done) => {
            rrSuperTest.get('/research-sites', true, 200, { 'near-zip': zipCode })
                .expect((res) => {
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
        ['50004', [1, 3]],
    ].forEach(([zipCode, indices]) => {
        it(`verify manually set zip codes ${zipCode}`, verifyNearbyIndicesFn(zipCode, indices));
    });

    it('release zip utilities', () => {
        zipUtil.findVicinity.restore();
    });

    // // ++ to be run by real api key and real zip code (Boston area)
    // it('login as super', shared.loginFn(config.superUser));
    // it('create research site with actual zip 02118', createResearchSiteFn(undefined, '02118'));
    // it('get research site with actual zip code 02118', getResearchSiteFn(10));
    // it('create research site with actual zip 02446', createResearchSiteFn(undefined, '02446'));
    // it('get research site with actual zip code 02446', getResearchSiteFn(11));
    // it('make sure to get for a nearby zip code', (done) => {
    //     rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '02151' })
    //         .expect((res) => {
    //             const nearResearchSiteSet = new Set(['02118', '02446']);
    //             let expected = hxResearchSite.listServers()
    //                 .filter(({ zip }) => nearResearchSiteSet.has(zip));
    //             expected = _.sortBy(expected, 'id');
    //             expect(res.body).to.deep.equal(expected);
    //         })
    //         .end(done);
    // });
    // // switch to washington area
    // it('update zip code for research site 0', (done) => {
    //     const id = hxResearchSite.id(10);
    //     const patch = { zip: '20850' };
    //     rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
    //         .expect(() => {
    //             Object.assign(hxResearchSite.server(10), patch);
    //         })
    //         .end(done);
    // });
    // it('update zip code for research site 11', (done) => {
    //     const id = hxResearchSite.id(11);
    //     const patch = { zip: '20852' };
    //     rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
    //         .expect(() => {
    //             Object.assign(hxResearchSite.server(11), patch);
    //         })
    //         .end(done);
    // });
    // it('make sure to get for a nearby zip code', (done) => {
    //     rrSuperTest.get('/research-sites', true, 200, { 'near-zip': '20816' })
    //         .expect((res) => {
    //             const nearResearchSiteSet = new Set(['20852', '20850']);
    //             let expected = hxResearchSite.listServers()
    //                 .filter(({ zip }) => nearResearchSiteSet.has(zip));
    //             expected = _.sortBy(expected, 'id');
    //             expect(res.body).to.deep.equal(expected);
    //         })
    //         .end(done);
    // });
    // // switch to manitoba, canada area
    // it('update zip code for research site 0', (done) => {
    //     const id = hxResearchSite.id(0);
    //     const patch = { zip: 'R0B0E0' };
    //     rrSuperTest.patch(`/research-sites/${id}`, patch, 204)
    //         .expect(() => {
    //             Object.assign(hxResearchSite.server(0), patch);
    //         })
    //         .end(done);
    // });
    // it('make sure to get for a nearby zip code with spaces', (done) => {
    //     rrSuperTest.get('/research-sites', true, 200, { 'near-zip': 'R0B0K0' })
    //         .expect((res) => {
    //             const nearResearchSiteSet = new Set(['R0B0E0']);
    //             let expected = hxResearchSite.listServers()
    //                 .filter(({ zip }) => nearResearchSiteSet.has(zip));
    //             expected = _.sortBy(expected, 'id');
    //             expect(res.body).to.deep.equal(expected);
    //         })
    //         .end(done);
    // });
    // it('make sure to get for a nearby zip code without spaces', (done) => {
    //     rrSuperTest.get('/research-sites', true, 200, { 'near-zip': 'R0B0K0' })
    //         .expect((res) => {
    //             const nearResearchSiteSet = new Set(['R0B0E0']);
    //             let expected = hxResearchSite.listServers()
    //                 .filter(({ zip }) => nearResearchSiteSet.has(zip));
    //             expected = _.sortBy(expected, 'id');
    //             expect(res.body).to.deep.equal(expected);
    //         })
    //         .end(done);
    // });
    // it('logout as super', shared.logoutFn());
});
