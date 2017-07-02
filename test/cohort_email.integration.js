/* global describe,before,after,it*/

'use strict';

process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SMTPServer = require('./util/smtp-server');
const SPromise = require('../lib/promise');
const aws = require('../lib/aws');
const questionCommon = require('./util/question-common');
const filterCommon = require('./util/filter-common');

const config = require('../config');

const expect = chai.expect;

describe('cohort email integration', function cohortEmailIntegration() {
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const hxQuestion = new History();
    const hxUser = new History();
    const qxTests = new questionCommon.IntegrationTests(rrSuperTest, { generator, hxQuestion });
    const filterTests = new filterCommon.IntegrationTests(rrSuperTest, hxQuestion);

    const server = new SMTPServer();
    const testCSV = 'a,b,c,d\n1,2,3,4';

    before(shared.setUpFn());

    it('start smtp server', function startSmtpServer() {
        server.listen(9001);
    });


    it('set up sinon mockup', () => {
        const models = rrSuperTest.getModels();
        sinon.stub(models.cohort, 'createCohort', () => SPromise.resolve(testCSV));
        sinon.stub(aws, 'putObject', (params, callback) => {
            callback(null, 's3datatest');
        });
    });

    it('login as super user', shared.loginFn(config.superUser));

    _.range(4).forEach((index) => {
        it(`create question ${index}`, qxTests.createQuestionFn());
        it(`get question ${index}`, qxTests.getQuestionFn(index));
    });

    it('create filter', filterTests.createFilterFn());
    it('get filter', filterTests.getFilterFn(0));

    let cohort;

    it('create cohort', function createCohort() {
        const filter = filterTests.hxFilter.server(0);
        cohort = { filterId: filter.id, count: 0, name: 'cohort_name' };
    });

    const clinicianInfo = {
        email: 'clinician@example.com',
        role: 'clinician',
        password: 'password',
    };

    it('create a clinician', shared.createUserFn(hxUser, null, clinicianInfo));

    it('logout as super user', shared.logoutFn());

    it('login as clinician', shared.loginIndexFn(hxUser, 0));

    it('error: no smtp settings is specified', function noSmtp() {
        return rrSuperTest.post('/cohorts', cohort, 400)
            .then(res => shared.verifyErrorMessage(res, 'smtpNotSpecified'));
    });

    it('logout as clinician', shared.logoutFn());

    const actualLink = '${link}'; // eslint-disable-line no-template-curly-in-string
    const smtpSpec = {
        protocol: 'smtp',
        username: 'smtp@example.com',
        password: 'pw',
        host: 'localhost',
        from: 'smtp@rr.com',
        otherOptions: {
            port: 9001,
        },
        subject: 'Cohort Admin',
        content: `Click on this please: ${actualLink}`,
    };

    it('login as super', shared.loginFn(config.superUser));

    it('setup server specifications', function setupSmtp() {
        return rrSuperTest.post('/smtp/cohort-csv', smtpSpec, 204);
    });

    it('logout as super', shared.logoutFn());

    it('login as clinician', shared.loginIndexFn(hxUser, 0));

    let cohortInfo;

    it('create cohort', function noSmtp() {
        return rrSuperTest.post('/cohorts', cohort, 201)
            .then((res) => {
                cohortInfo = res.body;
            });
    });

    it('check received email and link', function checkEmail() {
        const receivedEmail = server.receivedEmail;
        expect(receivedEmail.auth.username).to.equal(smtpSpec.username);
        expect(receivedEmail.auth.password).to.equal(smtpSpec.password);
        expect(receivedEmail.from).to.equal(smtpSpec.from);
        expect(receivedEmail.to).to.equal('clinician@example.com');
        const lines = receivedEmail.content.split('\r\n');
        let subjectFound = false;
        let link;
        lines.forEach((line, index) => {
            if (line.startsWith('Subject: ')) {
                const subject = line.split('Subject: ')[1];
                expect(subject).to.equal(smtpSpec.subject);
                subjectFound = true;
            }
            const lineStarts = 'Click on this please: ';
            if (line.startsWith(lineStarts)) {
                link = line.split('Click on this please: ')[1];
                const last = link.length - 1;
                if (link.charAt(last) === '=') {
                    link = link.slice(0, last) + lines[index + 1];
                }
            }
        });
        expect(subjectFound).to.equal(true);
        expect(link).to.equal(cohortInfo.s3Url);
    });

    it('logout as clinician', shared.logoutFn());

    it('restore mock libraries', function restoreSinonedLibs() {
        const models = rrSuperTest.getModels();
        models.cohort.createCohort.restore();
        aws.putObject.restore();
    });

    after((done) => {
        server.close(done);
    });
});
