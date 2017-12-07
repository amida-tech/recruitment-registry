/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');

const expect = chai.expect;
const shared = new SharedSpec();

describe('language unit', () => {
    before(shared.setUpFn());

    let languages;

    it('list existing languages', () => models.language.listLanguages()
            .then((result) => {
                languages = result;
                expect(languages).to.have.length.above(0);
            }));

    const example = {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe',
    };

    it('create language', () => models.language.createLanguage(example)
            .then(() => {
                languages.push(example);
                _.sortBy(languages, 'code');
            }));

    it('get language', () => models.language.getLanguage(example.code)
            .then((result) => {
                expect(result).to.deep.equal(example);
            }));

    it('list existing languages', () => models.language.listLanguages()
            .then((result) => {
                expect(result).to.deep.equal(languages);
            }));

    it('delete language', () => models.language.deleteLanguage('fr')
            .then(() => {
                _.remove(languages, { code: 'fr' });
            }));

    it('list existing languages', () => models.language.listLanguages()
            .then((result) => {
                expect(result).to.deep.equal(languages);
            }));

    it('patch language', () => {
        const languageUpdate = { name: 'Turk', nativeName: 'Türk' };
        return models.language.patchLanguage('tr', languageUpdate)
            .then(() => {
                const language = _.find(languages, { code: 'tr' });
                Object.assign(language, languageUpdate);
            });
    });

    it('list existing languages', () => models.language.listLanguages()
            .then((result) => {
                expect(result).to.deep.equal(languages);
            }));
});
