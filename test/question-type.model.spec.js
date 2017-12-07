/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const expect = chai.expect;

describe('question-type unit', () => {
    before(() => models.sequelize.sync({ force: true }));

    it('verify unforced sync keeps existing types', function verifyUnforcedSyncQuestionTypes() {
        const QuestionType = models.question.db.QuestionType;
        QuestionType.findAll({
            raw: true,
            attributes: ['name'],
        })
            .then(result => _.map(result, 'name').sort())
            .then((types) => {
                const rmName = types.splice(1, 1);
                return QuestionType.destroy({ where: { name: rmName } })
                    .then(() => QuestionType.sync())
                    .then(() => QuestionType.findAll({
                        raw: true,
                        attributes: ['name'],
                    }))
                    .then(result => _.map(result, 'name').sort())
                    .then((newTypes) => {
                        expect(newTypes).to.deep.equal(types);
                    });
            });
    });
});
