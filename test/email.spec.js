/* global describe,it */
// In the future, if we use rewire more often, we may look for a global ignore
// on dangling underscores.

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const spyLogger = require('winston-spy'); // eslint-disable-line no-unused-vars
const SharedSpec = require('./util/shared-spec');
const ccConfig = require('../config').constantContact;
let rewire = require('rewire'); // eslint-disable-line prefer-const
const winston = require('winston');

const email = rewire('../lib/email.js'); // Important: must reference WHOLE file.
const spy = sinon.spy();
const shared = new SharedSpec();
const expect = chai.expect;

describe('email unit', () => {
    const user = {
        id: 32,
        email: 'beet@vegetable.com',
    };

    winston.remove(winston.transports.Console);
    winston.add(winston.transports.SpyLogger, { spy });

    let requestStub;

    const ensureConstantContactConfig = email.__get__('ensureConstantContactConfig'); // eslint-disable-line no-underscore-dangle

    it('stub request', function stubRequest() {
        requestStub = shared.stubRequestPost(null, {
            statusCode: 201,
        });
    });

    it('confirms makeNewConstantContactOptions is setup as intended', () => {
        const makeNewConstantContactOptions = email.__get__('makeNewConstantContactOptions'); // eslint-disable-line no-underscore-dangle
        const results = makeNewConstantContactOptions(user.email);
        expect(results.url).to.be.equal(`${ccConfig.baseApiUrl}/contacts`);
        expect(results.headers.Authorization).to.be.equal(`Bearer ${ccConfig.token}`);
        expect(results.qs.api_key).to.be.equal(`${ccConfig.apiKey}`);
        expect(results.qs.action_by).to.be.equal('ACTION_BY_VISITOR');
        expect(results.json.email_addresses).to.contain({ email_address: user.email });
        expect(results.json.lists).to.contain({ id: ccConfig.listId });
    });

    /* Resetting environmental variables was a pain with a beforeEach to replace
    and restoring them from a cloned object. So I decided just to make it the
    responsibility of each test to restore things as they were after. Will look at
    better methods later. */
    it('confirms ensureConstantContactConfig returns false without apiKey', () => {
        const backup = ccConfig.apiKey;
        ccConfig.apiKey = undefined;
        expect(ensureConstantContactConfig()).to.be.equal(false);
        ccConfig.apiKey = backup;
    });

    it('confirms ensureConstantContactConfig returns false without token', () => {
        const backup = ccConfig.token;
        ccConfig.token = undefined;
        expect(ensureConstantContactConfig()).to.be.equal(false);
        ccConfig.token = backup;
    });

    it('confirms ensureConstantContactConfig returns false without baseApiUrl', () => {
        const backup = ccConfig.baseApiUrl;
        ccConfig.baseApiUrl = undefined;
        expect(ensureConstantContactConfig()).to.be.equal(false);
        ccConfig.baseApiUrl = backup;
    });

    it('confirms ensureConstantContactConfig returns true if baseApiUrl, token and apiKey are present', () => {
        expect(ensureConstantContactConfig()).to.be.equal(true);
    });

    it('confirms a logged message if sendCcEmailResponseHandler returns an error', () => {
        const sendCcEmailResponseHandler = email.__get__('sendCcEmailResponseHandler'); // eslint-disable-line no-underscore-dangle
        sendCcEmailResponseHandler('Doh!', { statusCode: 201 });
        expect(spy.calledWithExactly('error', 'Doh!'));
        spy.reset();
    });

    it('confirms a logged message if sendCcEmailResponseHandler receives an improper status code', () => {
        const sendCcEmailResponseHandler = email.__get__('sendCcEmailResponseHandler'); // eslint-disable-line no-underscore-dangle
        sendCcEmailResponseHandler(null, { statusCode: 301 });
        expect(spy.calledWith('error', 'Sending email has failed.'));
        spy.reset();
    });

    it('confirms no logged message if sendCcEmailResponseHandler is accepted', () => {
        const sendCcEmailResponseHandler = email.__get__('sendCcEmailResponseHandler'); // eslint-disable-line no-underscore-dangle
        sendCcEmailResponseHandler(null, { statusCode: 201 });
        expect(spy.called).to.be.equal(false);
        spy.reset();
    });

    it('confirms the request was rejected because of insufficient configuration ', () => {
        const backup = ccConfig.apiKey;
        ccConfig.apiKey = undefined;
        const sendCcEmail = email.__get__('sendCcEmail'); // eslint-disable-line no-underscore-dangle
        sendCcEmail(user);
        expect(requestStub.callCount).to.equal(0);
        ccConfig.apiKey = backup;
        requestStub.reset();
    });

    it('confirms the request was successfully sent ', () => {
        const sendCcEmail = email.__get__('sendCcEmail'); // eslint-disable-line no-underscore-dangle
        sendCcEmail(user);
        expect(requestStub.calledOnce);
        requestStub.reset();
    });

    it('restore original request', function restoreRequestModule() {
        requestStub.restore();
    });
});
