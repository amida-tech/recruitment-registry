/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');

const expect = chai.expect;

const QuestionType = models.QuestionType;

describe('question-type unit', function () {
    before(function () {
        return models.sequelize.sync({ force: true });
    });

    it('verify unforced sync keeps existing types', function () {
        return QuestionType.findAll({
                raw: true,
                attributes: ['name']
            })
            .then(result => _.map(result, 'name').sort())
            .then(types => {
                const rmName = types.splice(1, 1);
                return QuestionType.destroy({ where: { name: rmName } })
                    .then(() => QuestionType.sync())
                    .then(() => {
                        return QuestionType.findAll({
                            raw: true,
                            attributes: ['name']
                        });
                    })
                    .then(result => _.map(result, 'name').sort())
                    .then(newTypes => {
                        expect(newTypes).to.deep.equal(types);
                    });
            });
    });
});
