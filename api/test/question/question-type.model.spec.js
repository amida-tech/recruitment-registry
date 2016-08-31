/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';

var chai = require('chai');
var _ = require('lodash');

const db = require('../../db');

var expect = chai.expect;

var QuestionType = db.QuestionType;

describe('question-type unit', function () {
    before(function () {
        return QuestionType.sync({
            force: true
        });
    });

    it('default names', function () {
        return QuestionType.findAll({
            raw: true
        }).then(function (result) {
            const expected = QuestionType.possibleNames().sort();
            const actual = _.map(result, 'name').sort();
            expect(actual).to.deep.equal(expected);
            var name1st = QuestionType.possibleNames()[1];
            expect(QuestionType.idByName(name1st)).to.equal(2);
            expect(QuestionType.nameById(2)).to.equal(name1st);
        });
    });

    it('sync without force keeps default names', function () {
        const possibleNames = QuestionType.possibleNames();
        const removeName = possibleNames.splice(0, 1)[0];
        return QuestionType.destroy({
            where: {
                name: removeName
            }
        }).then(function () {
            return QuestionType.sync();
        }).then(function () {
            return QuestionType.findAll({
                raw: true
            });
        }).then(function (result) {
            const expected = possibleNames.sort();
            const actual = _.map(result, 'name').sort();
            expect(actual).to.deep.equal(expected);
        });
    });
});
