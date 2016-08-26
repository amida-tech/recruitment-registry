const Sequelize = require('sequelize');
const config    = require('./config');

const db = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  dialect: config.db.dialect,
  port: config.db.port,
  pool: {
    max: 20,
    min: 0,
    idle: 10000
  }
});

db
  .authenticate()
  .then(function() {
    console.log('Database connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database: ', err);
  });

module.exports = db;
