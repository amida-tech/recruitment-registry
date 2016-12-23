/* global describe,it*/
'use strict';
process.env.NODE_ENV = 'test';
process.env.RECREG_DB_NAME_OVERRIDE = 'recregmigrate';

const fs = require('fs');
const path = require('path');
const chai = require('chai');

const db = require('../models/db');
const dbMigrate = require('../migration/models');

const expect = chai.expect;

describe('migration spec', function () {
    it('sync current schema', function () {
        return db.sequelize.sync({ force: true });
    });

    it('drop migration bootstrap database', function () {
        return db.sequelize.query('DROP DATABASE IF EXISTS recregmigrate');
    });

    it('create migration bootstrap database', function () {
        return db.sequelize.query('CREATE DATABASE recregmigrate');
    });

    it('sync migration bootstrap schema', function () {
        return dbMigrate.sequelize.sync({ force: true });
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
});
