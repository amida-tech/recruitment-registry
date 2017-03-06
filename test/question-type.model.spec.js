/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const db = require('../models/db');

const expect = chai.expect;

const QuestionType = db.QuestionType;

describe('question-type unit', () => {
    before(() => models.sequelize.sync({ force: true }));

    it('verify unforced sync keeps existing types', () => QuestionType.findAll({
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
            }));
});
