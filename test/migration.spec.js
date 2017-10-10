/* global describe,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';
process.env.RECREG_DB_NAME_OVERRIDE = 'recregmigrate';

const fs = require('fs');
const path = require('path');
const chai = require('chai');

const db = require('../models/db');
const dbMigrate = require('../migration/models');
const config = require('../config');
const queryrize = require('../lib/queryrize');

const expect = chai.expect;
const foreignKeysQuery = queryrize.readQuerySync('foreign-keys.sql');

const checkData = function (query) {
    const options = { type: db.sequelize.QueryTypes.SELECT };
    return db.sequelize.query(query, options)
        .then((result) => {
            const p = dbMigrate.sequelize.query(query, options);
            return p.then((resultMigrated) => {
                expect(resultMigrated).to.deep.equal(result);
            });
        });
};

const checkBootstrapData = function (tableName) {
    const query = `SELECT name FROM ${tableName} ORDER BY name`;
    return checkData(query);
};

describe('migration spec', () => {
    if (!config.db.schema || config.db.schema === 'public') {
        it('drop all schemas', function dropAllSchemas() {
            return db.sequelize.dropAllSchemas();
        });

        it('sync current schema', () => {
            const queryInterface = db.sequelize.getQueryInterface();
            return queryInterface.dropAllTables()
                .then(() => queryInterface.dropAllEnums())
                .then(() => db.sequelize.sync({ force: true }));
        });

        it('drop migration bootstrap database', () => db.sequelize.query('DROP DATABASE IF EXISTS recregmigrate'));

        it('create migration bootstrap database', () => db.sequelize.query('CREATE DATABASE recregmigrate'));

        it('sync migration bootstrap schema', () => dbMigrate.sequelize.sync({ force: true }));

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
            return db.sequelize.Promise.all(pxs);
        });

        let tables;
        it('get/compare table list', function getCompareTableList() {
            const p = db.sequelize.getQueryInterface().showAllTables();
            return p
                .then((dbTables) => {
                    tables = dbTables;
                    tables.sort();
                    expect(tables.length).to.be.above(0);
                })
                .then(() => dbMigrate.sequelize.getQueryInterface().showAllTables())
                .then((dbMigrateTables) => {
                    dbMigrateTables.sort();
                    expect(dbMigrateTables).to.deep.equal(tables);
                });
        });

        it('get/compare foreign keys', () => db.sequelize.query(foreignKeysQuery, { type: db.sequelize.QueryTypes.SELECT })
            .then(foreignKeys => dbMigrate.sequelize.query(foreignKeysQuery, { type: db.sequelize.QueryTypes.SELECT })
                .then((migrateForeignKeys) => {
                    expect(migrateForeignKeys).to.deep.equal(foreignKeys);
                })));

        const normalizeDescription = function (description) {
            Object.keys(description).forEach((key) => {
                const value = description[key];
                if (value.special) {
                    value.special.sort();
                }
                delete value.primaryKey; // seqeulize bug.  fixed on master but not fixed
            });
        };

        it('compare table descriptions', function compareTableDescriptions() {
            const pxs = tables.map((tableName) => {
                const qi = db.sequelize.getQueryInterface();
                const qiMigrate = dbMigrate.sequelize.getQueryInterface();
                const px = qi.describeTable(tableName);
                return px
                    .then(tableDescription => qiMigrate.describeTable(tableName)
                        .then((migrateTableDescription) => {
                            normalizeDescription(tableDescription);
                            normalizeDescription(migrateTableDescription);
                            expect(migrateTableDescription).to.deep.equal(tableDescription);
                        }));
            });
            return db.sequelize.Promise.all(pxs);
        });

        const normalizeIndexes = function (indexes) {
            indexes.forEach((r) => {
                delete r.indkey;
            });
        };

        it('compare table indexes', () => {
            const pxs = tables.map(tableName => db.sequelize.getQueryInterface().showIndex(tableName)
                .then(indexes => dbMigrate.sequelize.getQueryInterface().showIndex(tableName)
                    .then((migrateIndexes) => {
                        normalizeIndexes(migrateIndexes);
                        normalizeIndexes(indexes);
                        expect(migrateIndexes).to.deep.equal(indexes);
                    })));
            return db.sequelize.Promise.all(pxs);
        });

        ['answer_type', 'survey_status', 'question_type', 'answer_rule_logic', 'smtp_type'].forEach((tableName) => {
            it(`compare ${tableName} records`, () => checkBootstrapData(tableName));
        });

        it('compare survey records', () => {
            const query = 'SELECT status FROM survey';
            return checkData(query);
        });
    }
});
