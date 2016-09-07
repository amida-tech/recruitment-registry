/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const models = require('../../models');

var expect = chai.expect;

var Ethnicity = models.Ethnicity;

describe('ethnicity unit', function () {
    before(function () {
        return Ethnicity.sync({
            force: true
        });
    });

    it('default names', function () {
        return Ethnicity.findAll({
            raw: true
        }).then(function (result) {
            const expected = Ethnicity.ethnicities().sort();
            const actual = _.map(result, 'name').sort();
            expect(actual).to.deep.equal(expected);
            var name1st = Ethnicity.ethnicities()[1];
            expect(Ethnicity.idByName(name1st)).to.equal(2);
            expect(Ethnicity.nameById(2)).to.equal(name1st);
        });
    });

    it('sync without force keeps default names', function () {
        const ethnicities = Ethnicity.ethnicities();
        const removeName = ethnicities.splice(0, 1)[0];
        return Ethnicity.destroy({
            where: {
                name: removeName
            }
        }).then(function () {
            return Ethnicity.sync();
        }).then(function () {
            return Ethnicity.findAll({
                raw: true
            });
        }).then(function (result) {
            const expected = ethnicities.sort();
            const actual = _.map(result, 'name').sort();
            expect(actual).to.deep.equal(expected);
        });
    });
});
