/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';
process.env.RECREG_DB_NAME_OVERRIDE = 'recregmigrate';

const fs = require('fs');
const path = require('path');
const chai = require('chai');

const db = require('../models/db');
const dbMigrate = require('../migration/models');
const config = require('../config');
//const queryrize = require('../lib/queryrize');

const seed = require('../migration/seed');
const seedMigrated = require('../migration/seed-migrated');

const expect = chai.expect;
//const foreignKeysQuery = queryrize.readQuerySync('foreign-keys.sql');

const checkData = function (query) {
    const options = { type: db.sequelize.QueryTypes.SELECT };
    return db.sequelize.query(query, options)
        .then(result => {
            return dbMigrate.sequelize.query(query, options)
                .then(resultMigrated => {
                    expect(resultMigrated).to.deep.equal(result);
                });
        });
};

const checkBootstrapData = function (tableName) {
    const query = `SELECT name FROM ${tableName} ORDER BY name`;
    checkData(query);
};

describe('migration spec', function () {
    if (!config.db.schema || config.db.schema === 'public') {
        it('sync current schema', function () {
            const queryInterface = db.sequelize.getQueryInterface();
            return queryInterface.dropAllTables()
                .then(() => db.sequelize.sync({ force: true }))
                .then(() => seedMigrated(queryInterface));
        });

        it('drop migration bootstrap database', function () {
            return db.sequelize.query('DROP DATABASE IF EXISTS recregmigrate');
        });

        it('create migration bootstrap database', function () {
            return db.sequelize.query('CREATE DATABASE recregmigrate');
        });

        it('sync migration bootstrap schema', function () {
            const queryInterface = dbMigrate.sequelize.getQueryInterface();
            return dbMigrate.sequelize.sync({ force: true })
                .then(() => seed(queryInterface));
        });

        it('apply all migrations', function () {
            const queryInterface = dbMigrate.sequelize.getQueryInterface();
            const Sequelize = dbMigrate.Sequelize;
            const migrateDirectory = path.join(__dirname, '../migration/migrations');
            const filenames = fs.readdirSync(migrateDirectory);
            filenames.sort();
            const pxs = filenames.map(filename => {
                const filepath = path.join(migrateDirectory, filename);
                const m = require(filepath);
                return m.up(queryInterface, Sequelize);
            });
            return db.sequelize.Promise.all(pxs);
        });

        let tables;
        it('get/compare table list', function () {
            return db.sequelize.getQueryInterface().showAllTables()
                .then(dbTables => {
                    tables = dbTables;
                    tables.sort();
                    expect(tables.length).to.be.above(0);
                })
                .then(() => dbMigrate.sequelize.getQueryInterface().showAllTables())
                .then(dbMigrateTables => {
                    dbMigrateTables.sort();
                    expect(dbMigrateTables).to.deep.equal(tables);
                });
        });

        //it('get/compare foreign keys', function () {
        //    return db.sequelize.query(foreignKeysQuery, { type: db.sequelize.QueryTypes.SELECT })
        //        .then(foreignKeys => {
        //            return dbMigrate.sequelize.query(foreignKeysQuery, { type: db.sequelize.QueryTypes.SELECT })
        //                .then(migrateForeignKeys => {
        //                    expect(migrateForeignKeys).to.deep.equal(foreignKeys);
        //                });
        //        });
        //});

        const normalizeDescription = function (description) {
            Object.keys(description).forEach(key => {
                const value = description[key];
                if (value.special) {
                    value.special.sort();
                }
                delete value.primaryKey; // seqeulize bug.  fixed on master but not fixed
            });
        };

        it('compare table descriptions', function () {
            const pxs = tables.map(tableName => {
                return db.sequelize.getQueryInterface().describeTable(tableName)
                    .then(tableDescription => {
                        return dbMigrate.sequelize.getQueryInterface().describeTable(tableName)
                            .then(migrateTableDescription => {
                                normalizeDescription(tableDescription);
                                normalizeDescription(migrateTableDescription);
                                expect(migrateTableDescription).to.deep.equal(tableDescription);
                            });
                    });

            });
            return db.sequelize.Promise.all(pxs);
        });

        it('compare table indexes', function () {
            const pxs = tables.map(tableName => {
                return db.sequelize.getQueryInterface().showIndex(tableName)
                    .then(indexes => {
                        return dbMigrate.sequelize.getQueryInterface().showIndex(tableName)
                            .then(migrateIndexes => {
                                expect(migrateIndexes).to.deep.equal(indexes);
                            });
                    });

            });
            return db.sequelize.Promise.all(pxs);
        });

        ['answer_type', 'survey_status', 'question_type'].forEach(tableName => {
            it(`compare ${tableName} records`, function () {
                return checkBootstrapData(tableName);
            });
        });

        it('compare survey records', function () {
            const query = 'SELECT status FROM survey';
            return checkData(query);
        });
    }
});
