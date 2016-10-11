/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('../util/shared-spec');
const ConsentSectionHistory = require('../util/consent-section-history');
const models = require('../../models');
const expect = chai.expect;

const User = models.User;
const shared = new SharedSpec();
const ConsentSectionType = models.ConsentSectionType;
const ConsentSection = models.ConsentSection;
const ConsentSectionSignature = models.ConsentSectionSignature;

describe('consent section unit', function () {
    const userCount = 4;

    const history = new ConsentSectionHistory(userCount);

    before(shared.setUpFn());

    const verifyConsentSectionTypeInListFn = function () {
        return function () {
            return ConsentSectionType.listConsentSectionTypes()
                .then(result => {
                    const types = history.listTypes();
                    expect(result).to.deep.equal(types);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create consent section type ${i}`, shared.createConsentSectionTypeFn(history));
        it(`verify consent section type list`, verifyConsentSectionTypeInListFn);
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(history.hxUser));
    }

    it('error: no consent sections of existing types', function () {
        return User.listConsentSections(history.userId(0))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentSections'));
    });

    const verifyConsentSectionFn = function (typeIndex) {
        return function () {
            const cs = history.server(typeIndex);
            return ConsentSection.getConsentSection(cs.id)
                .then(result => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create/verify consent section of type ${i}`, shared.createConsentSectionFn(history, i));
        it(`verify consent section content of type ${i}`, verifyConsentSectionFn(i));
    }

    const verifyConsentSectionsFn = function (userIndex, expectedIndices) {
        return function () {
            return User.listConsentSections(history.userId(userIndex))
                .then(consentSections => {
                    const expected = history.serversInList(expectedIndices);
                    expect(consentSections).to.deep.equal(expected);
                    return expected;
                })
                .then(() => {
                    const css = expectedIndices.map(index => history.server(index));
                    return models.sequelize.Promise.all(css.map(cs => {
                        return ConsentSection.getConsentSection(cs.id)
                            .then(result => {
                                expect(result).to.deep.equal(cs);
                            });
                    }));
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`verify consent sections required for user ${i}`, verifyConsentSectionsFn(i, [0, 1]));
    }

    const signConsentSectionTypeFn = function (userIndex, typeIndex) {
        return function () {
            const consentSectionId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex);
            return ConsentSectionSignature.createSignature(userId, consentSectionId);
        };
    };

    it('user 0 signs consent section 0', signConsentSectionTypeFn(0, 0));
    it('user 0 signs consent section 1', signConsentSectionTypeFn(0, 1));
    it('user 1 signs consent section 0', signConsentSectionTypeFn(1, 0));
    it('user 1 signs consent section 1', signConsentSectionTypeFn(1, 1));
    it('user 2 signs consent section 0', signConsentSectionTypeFn(2, 0));
    it('user 3 signs consent section 1', signConsentSectionTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, []));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0]));

    it('error: invalid user signs consent section 0', function () {
        const consentSectionId = history.activeConsentSections[0].id;
        return ConsentSectionSignature.createSignature(9999, consentSectionId)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('error: user 0 signs invalid consent section', function () {
        const userId = history.userId(0);
        return ConsentSectionSignature.createSignature(userId, 9999)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('add a new consent section type', shared.createConsentSectionTypeFn(history));
    it(`verify the new consent section in the list`, verifyConsentSectionTypeInListFn);

    it('error: no consent sections of existing types', function () {
        return User.listConsentSections(history.userId(2))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentSections'));
    });

    it('create/verify consent section of type 2', shared.createConsentSectionFn(history, 2));
    it(`verify consent section content of type 2)`, verifyConsentSectionFn(2));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [2]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1, 2]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 2]));

    it('user 2 signs consent section 2', signConsentSectionTypeFn(2, 2));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));

    it('create/verify consent section of type 1', shared.createConsentSectionFn(history, 1));
    it(`verify consent section content of type 1)`, verifyConsentSectionFn(1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [1, 2]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 1 signs consent section 2', signConsentSectionTypeFn(1, 2));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [1]));

    it('create/verify consent section of type 0', shared.createConsentSectionFn(history, 0));
    it(`verify consent section content of type 0)`, verifyConsentSectionFn(0));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 2 signs consent section 1', signConsentSectionTypeFn(2, 1));
    it('user 3 signs consent section 1', signConsentSectionTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 2]));

    it('create/verify consent section of type 1', shared.createConsentSectionFn(history, 1));
    it(`verify consent section content of type 1)`, verifyConsentSectionFn(1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 0 signs consent section 1', signConsentSectionTypeFn(0, 1));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 2]));
    it('user 0 signs consent section 2', signConsentSectionTypeFn(0, 2));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0]));
    it('user 0 signs consent section 0', signConsentSectionTypeFn(0, 0));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));

    it('delete consent section type 1', function () {
        const id = history.typeId(1);
        return ConsentSectionType.deleteConsentSectionType(id)
            .then(() => {
                history.deleteType(1);
                return ConsentSectionType.listConsentSectionTypes()
                    .then(result => {
                        const types = history.listTypes();
                        expect(result).to.deep.equal(types);
                    });
            });
    });

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1]));

    const verifySignatureExistenceFn = function (userIndex) {
        return function () {
            const userId = history.userId(userIndex);
            return ConsentSectionSignature.findAll({
                    where: { userId },
                    raw: true,
                    attributes: ['consentSectionId', 'createdAt'],
                    order: 'consent_section_id'
                })
                .then(result => {
                    const actual = _.map(result, 'consentSectionId');
                    const expected = _.sortBy(history.signatures[userIndex]);
                    expect(actual).to.deep.equal(expected);
                    const allExists = _.map(result, 'createdAt').map(r => !!r);
                    expect(allExists).to.deep.equal(Array(expected.length).fill(true));
                });
        };
    };

    for (let i = 0; i < userCount; ++i) {
        it(`verify all signings still exists for user ${i}`, verifySignatureExistenceFn(i));
    }

    it('verify all consent sections still exists', function () {
        const queryParams = { raw: true, attributes: ['id', 'typeId', 'content', 'updateComment'], order: ['id'] };
        const queryParamsAll = Object.assign({}, { paranoid: false }, queryParams);
        return ConsentSection.findAll(queryParamsAll)
            .then(consentSections => {
                expect(consentSections).to.deep.equal(history.consentSections);
            })
            .then(() => ConsentSection.findAll(queryParams))
            .then(consentSections => {
                const expected = _.sortBy([history.server(0), history.server(1)], 'id');
                expect(consentSections).to.deep.equal(expected);
            });
    });
});
