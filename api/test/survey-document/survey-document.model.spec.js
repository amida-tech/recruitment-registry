/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const shared = require('../shared-spec');
const models = require('../../models');
const entityGen = require('../entity-generator');

const expect = chai.expect;

const Document = models.Document;
const Registry = models.Registry;
const SurveyDocument = models.SurveyDocument;
//const User = models.User;

describe('survey-document unit', function () {
    const docTypeCount = 2;
    const userCount = 4;

    const store = {
        clientRegistry: null,
        profileSurvey: null,
        profileSurveyDocuments: [],
        userIds: [],
        profileResponses: [],
        documentTypes: [],
        clientDocuments: [],
        documents: [],
        activeDocuments: [],
        signatures: _.range(userCount).map(() => [])
    };

    before(shared.setUpFn());

    it('create registry', function () {
        const newRegistry = entityGen.genNewRegistry();
        store.clientRegistry = newRegistry;
        return Registry.createRegistry(newRegistry);
    });

    it('get registry profile survey, verify no required documents', function () {
        return Registry.getRegistryProfileSurvey(store.clientRegistry.name)
            .then(survey => {
                expect(survey.id).to.be.above(0);
                expect(survey.documents).to.equal(undefined);
                store.profileSurvey = survey;
            });
    });

    for (let i = 0; i < docTypeCount; ++i) {
        it(`create document type ${i}`, shared.createDocumentTypeFn(store));
    }

    const createProfileSurveyDocumentFn = function (typeIndex, action) {
        return function () {
            const documentTypeId = store.documentTypes[typeIndex].id;
            const surveyId = store.profileSurvey.id;
            return SurveyDocument.createSurveyDocumentType({ surveyId, documentTypeId, action })
                .then(({ id }) => store.profileSurveyDocuments.push({ id, documentTypeId, action }));
        };
    };

    for (let i = 0; i < docTypeCount; ++i) {
        it(`require document type ${i} in survey question`, createProfileSurveyDocumentFn(i, 'write'));
    }

    it('error: get profile survey with no documents of existing types', function () {
        return Registry.getRegistryProfileSurvey(store.clientRegistry.name)
            .then(shared.throwingHandler, shared.expectedErrorHandler('documentNoSystemDocuments'));
    });

    for (let i = 0; i < docTypeCount; ++i) {
        it(`create document of type ${i}`, shared.createDocumentFn(store, i));
    }

    const expectedDocuments = function (indices) {
        const rawExpected = indices.map(index => ({
            id: store.activeDocuments[index].id,
            description: store.documentTypes[index].description
        }));
        return _.sortBy(rawExpected, 'id');
    };

    it('get registry profile survey with required documents', function () {
        return Registry.getRegistryProfileSurvey(store.clientRegistry.name)
            .then(actual => {
                expect(actual.id).to.equal(store.profileSurvey.id);
                const expected = expectedDocuments([0, 1]);
                expect(actual.documents).to.deep.equal(expected);
            });
    });

    const verifyDocumentContentFn = function (typeIndex) {
        return function () {
            const doc = store.activeDocuments[typeIndex];
            return Document.getContent(doc.id)
                .then(result => {
                    expect(result).to.deep.equal({ content: doc.content });
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`get/verify document content of type ${i}`, verifyDocumentContentFn(i));
    }

    const formProfileResponse = function () {
        const registryName = store.clientRegistry.name;
        const answers = entityGen.genAnswersToQuestions(store.profileSurvey.questions);
        const user = entityGen.genNewUser();
        store.profileResponses.push({ registryName, user, answers });
    };

    //const createProfileWithoutSignaturesFn = function (index, signIndices, missingDocumentIndices) {
    //    return function() {
    //        let signObj = {};
    //        if (signIndices) {
    //            const signatures = signIndices.map((signIndex => store.activeDocuments[signIndex]).id);
    //            signObj = Object.assign({}, store.profileResponses[index], {signatures});
    //        }
    //        const response = Object.assign({}, store.profileResponses[index], signObj);
    //        return Registry.createProfile(response)
    //            .catch(err => {
    //                console.log(err);
    //                throw err;
    //            })
    //            .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
    //            .then(err => {
    //                const expected = expectedDocuments(missingDocumentIndices);
    //                expect(err.documents).to.deep.equal(expected);
    //            });
    //    };
    //};

    //const createProfileFn = function (index, signIndices) {
    //    return function() {
    //        const signatures = signIndices.map((signIndex => store.activeDocuments[signIndex]).id);
    //        let signObj = Object.assign({}, store.profileResponses[index], {signatures});
    //        const response = Object.assign({}, store.profileResponses[index], signObj);
    //        return Registry.createProfile(response)
    //            .then(() => User.listDocuments(store.userIds[index]))
    //            .then(documents => expect(documents).to.have.length(0));
    //    };
    //};

    for (let i = 0; i < 4; ++i) {
        it(`form profile survey input for user ${i}`, formProfileResponse);
        //it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        //it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        //it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [0], [1]));
        //it(`create user profile ${i} without signatures 4`, createProfileWithoutSignaturesFn(i, [1], [0]));
        //it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
    }
});
