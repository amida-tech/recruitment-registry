/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('profile survey unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);

    it('error: get profile survey when none created', function () {
        return models.profileSurvey.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function () {
        const clientSurvey = generator.newSurvey();
        return function () {
            return models.profileSurvey.createProfileSurvey(clientSurvey)
                .then(idOnlyServer => hxSurvey.push(clientSurvey, idOnlyServer));
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function () {
            return models.profileSurvey.getProfileSurvey()
                .then(server => {
                    const id = hxSurvey.id(index);
                    expect(server.id).to.equal(id);
                    hxSurvey.updateServer(index, server);
                    return comparator.survey(hxSurvey.client(index), server);
                });
        };
    };

    const translateProfileSurveyFn = function (index, language) {
        return function () {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            delete translation.id;
            return models.profileSurvey.updateProfileSurveyText(translation, language)
                .then(() => {
                    hxSurvey.translate(index, language, translation);
                });
        };
    };

    const verifyNotTranslatedProfileSurveyFn = function (index, language) {
        return function () {
            return models.profileSurvey.getProfileSurvey({ language })
                .then(result => {
                    const expected = hxSurvey.server(index);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const verifyTranslatedProfileSurveyFn = function (index, language) {
        return function () {
            return models.profileSurvey.getProfileSurvey({ language })
                .then(result => {
                    translator.isSurveyTranslated(result, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('create profile survey 0', createProfileSurveyFn());
    it('get/verify profile survey 0', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey 0', verifyProfileSurveyFn(0));

    it('get profile survey 0 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(0, 'es'));

    it('translate profile survey 0 to spanish', translateProfileSurveyFn(0, 'es'));

    it('get/verify translated profile survey 0 (spanish)', verifyTranslatedProfileSurveyFn(0, 'es'));

    it('create profile survey 1', createProfileSurveyFn());

    it('get/verify profile survey 1', verifyProfileSurveyFn(1));

    it('get profile survey 1 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(1, 'es'));

    it('translate profile survey 1 to spanish', translateProfileSurveyFn(1, 'es'));

    it('get/verify translated profile survey 1 (spanish)', verifyTranslatedProfileSurveyFn(1, 'es'));
});
