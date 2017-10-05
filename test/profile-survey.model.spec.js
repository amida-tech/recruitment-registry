/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const SurveyHistory = require('./util/survey-history');
const Generator = require('./util/generator');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('profile survey unit', () => {
    before(shared.setUpFn());

    const hxSurvey = new SurveyHistory();

    const emptyProfileSurvey = function () {
        return models.profileSurvey.getProfileSurvey()
            .then((result) => {
                expect(result.exists).to.equal(false);
            });
    };

    const emptyProfileSurveyId = function () {
        return models.profileSurvey.getProfileSurveyId()
            .then(id => expect(id).to.equal(0));
    };

    it('get profile survey when none created', emptyProfileSurvey);

    it('get profile survey id when none created', emptyProfileSurveyId);

    const createProfileSurveyIdFn = function () {
        const survey = generator.newSurvey();
        return function createProfileSurveyId() {
            return models.survey.createSurvey(survey)
                .then((id) => {
                    hxSurvey.push(survey, { id });
                    return models.profileSurvey.createProfileSurveyId(id);
                });
        };
    };

    const verifyProfileSurveyIdFn = function (index) {
        return function verifyProfileSurveyId() {
            return models.profileSurvey.getProfileSurveyId()
                .then((profileSurveyId) => {
                    const id = hxSurvey.id(index);
                    expect(profileSurveyId).to.equal(id);
                });
        };
    };

    const translateProfileSurveyFn = function (index, language) {
        return function translateProfileSurvey() {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            return models.survey.patchSurveyText(translation, language)
                .then(() => hxSurvey.translate(index, language, translation));
        };
    };

    const verifyNotTranslatedProfileSurveyFn = function (index, language) {
        return function verifyNotTranslatedProfileSurvey() {
            return models.profileSurvey.getProfileSurvey({ language })
                .then((profileSurvey) => {
                    expect(profileSurvey.exists).to.equal(true);
                    const expected = hxSurvey.server(index);
                    expect(profileSurvey.survey).to.deep.equal(expected);
                });
        };
    };

    const verifyTranslatedProfileSurveyFn = function (index, language) {
        return function verifyTranslatedProfileSurvey() {
            return models.profileSurvey.getProfileSurvey({ language })
                .then((profileSurvey) => {
                    expect(profileSurvey.exists).to.equal(true);
                    translator.isSurveyTranslated(profileSurvey.survey, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(profileSurvey.survey).to.deep.equal(expected);
                });
        };
    };

    const deleteProfileSurveyId = function () {
        return models.profileSurvey.deleteProfileSurveyId();
    };

    it('create profile survey 0 using id', createProfileSurveyIdFn());

    it('get/verify profile survey 0', shared.verifyProfileSurveyFn(hxSurvey, 0));

    it('get/verify profile survey 0 id', verifyProfileSurveyIdFn(0));

    it('get profile survey 0 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(0, 'es'));

    it('translate profile survey 0 to spanish', translateProfileSurveyFn(0, 'es'));

    it('get/verify translated profile survey 0 in spanish', verifyTranslatedProfileSurveyFn(0, 'es'));

    it('create profile survey 1 using id', createProfileSurveyIdFn());

    it('get/verify profile survey 1 id', verifyProfileSurveyIdFn(1));

    it('get/verify profile survey 1', shared.verifyProfileSurveyFn(hxSurvey, 1));

    it('get profile survey 1 in spanish when no translation', verifyNotTranslatedProfileSurveyFn(1, 'es'));

    it('translate profile survey 1 to spanish', translateProfileSurveyFn(1, 'es'));

    it('get/verify translated profile survey 1 in spanish', verifyTranslatedProfileSurveyFn(1, 'es'));

    it('create profile survey 2', shared.createProfileSurveyFn(hxSurvey));

    it('get/verify profile survey 2', shared.verifyProfileSurveyFn(hxSurvey, 2));

    it('get/verify profile survey 2 id', verifyProfileSurveyIdFn(2));

    it('delete profile survey', deleteProfileSurveyId);

    it('verify empty profile survey', emptyProfileSurvey);

    it('verify empty profile survey id', emptyProfileSurveyId);

    it('create profile survey 3', shared.createProfileSurveyFn(hxSurvey));

    it('get/verify profile survey 3', shared.verifyProfileSurveyFn(hxSurvey, 3));

    it('get/verify profile survey 3 id', verifyProfileSurveyIdFn(3));

    it('delete survey 3', () => {
        const id = hxSurvey.id(3);
        return models.survey.deleteSurvey(id);
    });

    it('verify empty profile survey', emptyProfileSurvey);

    it('verify empty profile survey id', emptyProfileSurveyId);

    it('create profile survey 4', shared.createProfileSurveyFn(hxSurvey));

    it('get/verify profile survey 4', shared.verifyProfileSurveyFn(hxSurvey, 4));

    it('get/verify profile survey 4 id', verifyProfileSurveyIdFn(4));

    it('replace survey 4', () => {
        const sid = hxSurvey.id(4);
        const replacementSurvey = generator.newSurvey();
        return models.survey.replaceSurvey(sid, replacementSurvey)
            .then((id) => {
                hxSurvey.push(replacementSurvey, { id });
            });
    });

    it('get/verify profile survey 5 (replaced 4)', shared.verifyProfileSurveyFn(hxSurvey, 5));

    it('get/verify profile survey 5 (replaced 4) id', verifyProfileSurveyIdFn(5));
});
