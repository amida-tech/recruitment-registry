/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('../helpers');
const db = require('../../db');

var expect = chai.expect;

var Ethnicity = db.Ethnicity;
var User = db.User;

describe('user unit', function () {
    before(function () {
        return Ethnicity.sync({
            force: true
        }).then(function () {
            return User.sync({
                force: true
            });
        });
    });

    const example = {
        username: 'test',
        password: 'password',
        email: 'test@example.com',
        zip: '20850',
        ethnicity: 'Hispanic'
    };

    var id;

    it('post/get user', function () {
        return User.create(example).then(function (user) {
            id = user.id;
            return User.getUser(user.id).then(function (actual) {
                var expected = _.cloneDeep(example);
                expected.id = user.id;
                expected.password = user.password;
                delete actual.createdAt;
                delete actual.updatedAt;
                expect(actual).to.deep.equal(expected);
            });
        });
    });
});
