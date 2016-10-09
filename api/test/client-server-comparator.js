'use strict';

const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

const comparator = {
    question(client, server) {
        const expected = _.cloneDeep(client);
        const actual = _.cloneDeep(server);
        if (expected.type === 'choices') {
            expected.choices.forEach((choice) => choice.type = choice.type || 'bool');
        }
        if (expected.type === 'choice' && expected.oneOfChoices) {
            expected.choices = expected.oneOfChoices.map(choice => ({ text: choice }));
            delete expected.oneOfChoices;
        }
        delete actual.id;
        if (actual.choices) {
            actual.choices.forEach(choice => delete choice.id);
        }
        expect(actual).to.deep.equal(expected);
    },
    questions(client, server) {
        const n = client.length;
        expect(n).to.equal(server.length);
        for (let i = 0; i < n; ++i) {
            comparator.question(client[i], server[i]);
        }
    }
};

module.exports = comparator;
