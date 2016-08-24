const SQ = require('sequelize');
const db = require('./../database');

const User = db.define('user', {
  email: SQ.STRING(255),
  password: SQ.STRING,
  admin: SQ.BOOLEAN
  }, {
    timestamps: false
  });

module.exports = User;