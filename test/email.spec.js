'user strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('request');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const logger = require('../logger');

const SharedSpec = require('./util/shared-spec');
const sendMail = require('../lib/email');
const ccConfig = require('../config').constantContact;

var rewire = require('rewire');
var email = rewire('../lib/email.js'); //Important: must reference WHOLE file.

const shared = new SharedSpec();
const expect = chai.expect;

describe('email unit', () => {
  var user = {
    id: 32,
    email: 'beet@vegetable.com'
  };

  const stubRequestPostSuccessful = function stubRequestPostSuccessful(){
    return shared.stubRequestPost(null, {
      statusCode: 201
    });
  };

  const stubRequestPostFailure = function stubRequestPostFailure(){
    return shared.stubRequestPost('Bad news.', {
      statusCode: 404
    });
  };

  const ensureConstantContactConfig = email.__get__('ensureConstantContactConfig');

  it('confirms makeNewConstantContactOptions is setup as intended', () => {
    var makeNewConstantContactOptions = email.__get__('makeNewConstantContactOptions');
    var results = makeNewConstantContactOptions(user.email);
    expect(results.method).to.be.equal('POST');
    expect(results.url).to.be.equal(`${ccConfig.baseApiUrl}/contacts`);
    expect(results.headers.Authorization).to.be.equal(`Bearer ${ccConfig.token}`);
    expect(results.qs.api_key).to.be.equal(`${ccConfig.apiKey}`);
    expect(results.qs.action_by).to.be.equal('ACTION_BY_VISITOR');
    expect(results.json.email_addresses).to.contain({'email_address' : user.email});
    expect(results.json.lists).to.contain({'id' : ccConfig.listId});
  });

  /*Resetting environmental variables was a pain with a beforeEach to replace
  and restoring them from a cloned object. So I decided just to make it the
  responsibility of each test to restore things as they were after. Will look at
  better methods later.*/
  it('confirms ensureConstantContactConfig returns false without apiKey', () => {
    var backup = ccConfig.apiKey;
    ccConfig.apiKey = undefined;
    expect(ensureConstantContactConfig()).to.be.equal(false);
    ccConfig.apiKey = backup;
  });

  it('confirms ensureConstantContactConfig returns false without token', () => {
    var backup = ccConfig.token;
    ccConfig.token = undefined;
    expect(ensureConstantContactConfig()).to.be.equal(false);
    ccConfig.token = backup;
  });

  it('confirms ensureConstantContactConfig returns false without baseApiUrl', () => {
    var backup = ccConfig.baseApiUrl;
    ccConfig.baseApiUrl = undefined;
    expect(ensureConstantContactConfig()).to.be.equal(false);
    ccConfig.baseApiUrl = backup;
  });

  it('confirms ensureConstantContactConfig returns true if baseApiUrl, token and apiKey are present', () => {
    expect(ensureConstantContactConfig()).to.be.equal(true);
  });

  it('confirms a logged message if sendCcEmailResponseHandler returns an error', () => {
    sinon.spy(logger, 'log');
    var sendCcEmailResponseHandler = email.__get__('sendCcEmailResponseHandler');
    sendCcEmailResponseHandler('Doh!', {statusCode: 201});
    expect(logger.log).to.have.been.calledWith('error', 'Doh!');
  });

  it('confirms a logged message if sendCcEmailResponseHandler receives an improper status code', () => {
    var sendCcEmailResponseHandler = email.__get__('sendCcEmailResponseHandler');
    sendCcEmailResponseHandler(null, {statusCode: 301});

  })

});
