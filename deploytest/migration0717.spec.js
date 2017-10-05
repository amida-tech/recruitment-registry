/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const childProcess = require('child_process');
const _ = require('lodash');

const models = require('../models');
const dbMigrate = require('../migration/models');
const config = require('../config');
const converter = require('./converter');

const expect = chai.expect;

describe('migration spec', () => {
    if (!config.db.schema || config.db.schema === 'public') {
        it('drop/create database', function dropDb() {
            childProcess.execSync('dropdb --if-exists recregtest');
            childProcess.execSync('createdb recregtest');
        });

        it('restore from pg_dump', function restoreFromPGDump() {
            const dumpPath = path.resolve(__dirname, './r003_test_dump.sql');
            const dumpSql = fs.readFileSync(dumpPath);
            childProcess.execSync('psql recregtest', {
                input: dumpSql,
            });
        });

        it('sync migration bootstrap schema', function syncMigration() {
            return dbMigrate.sequelize.sync({ force: false });
        });

        it('apply all migrations', function appluAllMigrations() {
            const queryInterface = dbMigrate.sequelize.getQueryInterface();
            const Sequelize = dbMigrate.Sequelize;
            const migrateDirectory = path.join(__dirname, '../migration/migrations');
            const filenames = fs.readdirSync(migrateDirectory);
            filenames.sort();
            const pxs = filenames.map((filename) => {
                const filepath = path.join(migrateDirectory, filename);
                const m = require(filepath); // eslint-disable-line global-require, import/no-dynamic-require
                return m.up(queryInterface, Sequelize);
            });
            return dbMigrate.sequelize.Promise.all(pxs);
        });

        it('sync migrated', function syncMigrated() {
            return models.sequelize.sync({ force: false });
        });

        it('data conversion', function conversion() {
            return converter(models);
        });

        let surveyId;

        it('verify survey', function verifySurvey() {
            return models.survey.listSurveys()
                .then((surveys) => {
                    expect(surveys.length).to.equal(1);
                    surveyId = surveys[0].id;
                })
                .then(() => models.survey.getSurvey(surveyId))
                .then((survey) => {
                    expect(survey.questions).to.have.length(2);
                    survey.questions.forEach((question) => {
                        const text = question.text.toLowerCase();
                        expect(text).to.not.equal('first name');
                        expect(text).to.not.equal('last name');
                        expect(question.type).to.not.equal('text');
                    });
                });
        });

        const questionIds = [];

        it('verify questions', function verifyQuestions() {
            return models.question.listQuestions()
                .then((questions) => {
                    expect(questions).to.have.length(2);
                    questions.forEach((question) => {
                        const text = question.text.toLowerCase();
                        expect(text).to.not.equal('first name');
                        expect(text).to.not.equal('last name');
                        expect(question.type).to.not.equal('text');
                        questionIds.push(question.id);
                    });
                });
        });

        const participants = _.range(5);

        it('verify participants', function verifyParticipants() {
            return models.user.listUsers({ role: 'participant' })
                .then((users) => {
                    expect(users).to.have.length(5);
                    users.forEach((participant) => {
                        const email = participant.email;
                        expect(email.search(/^email_\d@example\.com$/g)).to.be.above(-1);
                        const index = parseInt(email.slice(6, 7), 10);
                        participants[index] = participant;
                        expect(participant.firstname).to.equal(`firstname_${index}`);
                        expect(participant.lastname).to.equal(`lastname_${index}`);
                    });
                });
        });

        _.range(5).forEach((index) => {
            it('verify answers', function verifyAnswers() {
                const userId = participants[index].id;
                return models.answer.listAnswers({ userId, surveyId })
                    .then((answers) => {
                        answers.forEach((answer) => {
                            expect(questionIds).to.include(answer.questionId);
                            const actualAnswer = answer.answer;
                            if (actualAnswer.yearValue) {
                                expect(actualAnswer.yearValue).to.equal(`197${index}`);
                            } else if (actualAnswer.textValue) {
                                expect(actualAnswer.textValue).to.equal(`2000${index}`);
                            } else {
                                throw new Error('Unexpected value property');
                            }
                        });
                    });
            });
        });
    }
});
