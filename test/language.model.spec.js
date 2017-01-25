/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');

const expect = chai.expect;
const shared = new SharedSpec();

describe('language unit', function () {
    before(shared.setUpFn());

    let languages;

    it('list existing languages', function () {
        return models.language.listLanguages()
            .then(result => {
                languages = result;
                expect(languages).to.have.length.above(0);
            });
    });

    const example = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe'
    };

    it('create language', function () {
        return models.language.createLanguage(example)
            .then(() => {
                languages.push(example);
                _.sortBy(languages, 'code');
            });
    });

    it('get language', function () {
        return models.language.getLanguage(example.code)
            .then(result => {
                expect(result).to.deep.equal(example);
            });
    });

    it('list existing languages', function () {
        return models.language.listLanguages()
            .then(result => {
                expect(result).to.deep.equal(languages);
            });
    });

    it('delete language', function () {
        return models.language.deleteLanguage('fr')
            .then(() => {
                _.remove(languages, { code: 'fr' });
            });
    });

    it('list existing languages', function () {
        return models.language.listLanguages()
            .then(result => {
                expect(result).to.deep.equal(languages);
            });
    });

    it('patch language', function () {
        const languageUpdate = { name: 'Turk', nativeName: 'Türk' };
        return models.language.patchLanguage('tr', languageUpdate)
            .then(() => {
                const language = _.find(languages, { code: 'tr' });
                Object.assign(language, languageUpdate);
            });
    });

    it('list existing languages', function () {
        return models.language.listLanguages()
            .then(result => {
                expect(result).to.deep.equal(languages);
            });
    });
});
