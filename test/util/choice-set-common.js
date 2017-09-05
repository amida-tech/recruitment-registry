'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const chai = require('chai');

const models = require('../../models');
const comparator = require('./comparator');

const expect = chai.expect;

const SpecTests = class ChoiceSetSpecTests {
    constructor(generator, hxChoiceSet) {
        this.generator = generator;
        this.hxChoiceSet = hxChoiceSet;
    }

    createChoiceSetFn(overrideChoiceSet) {
        const generator = this.generator;
        const hxChoiceSet = this.hxChoiceSet;
        return function createChoiceSet() {
            const choiceSet = overrideChoiceSet || generator.newChoiceSet();
            return models.choiceSet.createChoiceSet(choiceSet)
                .then(({ id }) => hxChoiceSet.push(choiceSet, { id }));
        };
    }

    getChoiceSetFn(index) {
        const hxChoiceSet = this.hxChoiceSet;
        return function getChoice() {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.getChoiceSet(id)
                .then((choiceSet) => {
                    hxChoiceSet.updateServer(index, choiceSet);
                    comparator.choiceSet(hxChoiceSet.client(index), choiceSet);
                });
        };
    }

    verifyChoiceSetFn(index) {
        const hxChoiceSet = this.hxChoiceSet;
        return function verifyChoiceSet() {
            const expected = hxChoiceSet.server(index);
            return models.choiceSet.getChoiceSet(expected.id)
                .then((choiceSet) => {
                    expect(choiceSet).to.deep.equal(expected);
                });
        };
    }

    deleteChoiceSetFn(index) {
        const hxChoiceSet = this.hxChoiceSet;
        return function deleteChoiceSet() {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.deleteChoiceSet(id)
                .then(() => {
                    hxChoiceSet.remove(index);
                });
        };
    }

    listChoiceSetsFn() {
        const hxChoiceSet = this.hxChoiceSet;
        return function listChoiceSets() {
            return models.choiceSet.listChoiceSets()
                .then((choiceSets) => {
                    const expected = hxChoiceSet.listServers(['id', 'reference']);
                    expect(choiceSets).to.deep.equal(expected);
                });
        };
    }
};

const IntegrationTests = class ChoiceSetIntegrationTests {
    constructor(rrSuperTest, generator, hxChoiceSet) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxChoiceSet = hxChoiceSet;
    }

    createChoiceSetFn(overrideChoiceSet) {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function createChoiceSet(done) {
            const choiceSet = overrideChoiceSet || generator.newChoiceSet();
            rrSuperTest.post('/choice-sets', choiceSet, 201)
                .expect((res) => {
                    hxChoiceSet.push(choiceSet, res.body);
                })
                .end(done);
        };
    }

    getChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function getChoiceSet(done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.get(`/choice-sets/${id}`, true, 200)
                .expect((res) => {
                    hxChoiceSet.updateServer(index, res.body);
                    comparator.choiceSet(hxChoiceSet.client(index), res.body);
                })
                .end(done);
        };
    }

    verifyChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function verifyChoiceSet() {
            const expected = hxChoiceSet.server(index);
            return rrSuperTest.get(`/choice-sets/${expected.id}`, true, 200)
                .then((res) => {
                    expect(res.body).to.deep.equal(expected);
                });
        };
    }

    deleteChoiceSetFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function deleteChoiceSet(done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.delete(`/choice-sets/${id}`, 204)
                .expect(() => {
                    hxChoiceSet.remove(index);
                })
                .end(done);
        };
    }

    listChoiceSetsFn() {
        const rrSuperTest = this.rrSuperTest;
        const hxChoiceSet = this.hxChoiceSet;
        return function listChoiceSets(done) {
            rrSuperTest.get('/choice-sets', true, 200)
                .expect((res) => {
                    const expected = hxChoiceSet.listServers(['id', 'reference']);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
