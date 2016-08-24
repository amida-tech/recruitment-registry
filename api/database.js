const Sequelize = require('sequelize');
const config    = require('./config');

const db = new Sequelize('MDB_Auth', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  port: '5432',
  pool: {
    max: 20,
    min: 0,
    idle: 10000
  }
});

db
  .authenticate()
  .then(function(err) {
    console.log('Database connection has been established successfully. ');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database: ', err);
  });

module.exports = db;
