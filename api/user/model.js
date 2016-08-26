const SQ = require('sequelize');
const db = require('./../database');
const bcrypt = require('bcrypt');


const User = db.define('user', {
  email: SQ.STRING(255),
  password: SQ.STRING,
  admin: SQ.BOOLEAN
  }, {
    timestamps: false,
    classMethods: {
      hashPassword: function(password) {
        return bcrypt.hashSync(password, 10);
      },
      comparePassword: function(password, hash) {
        return bcrypt.compareSync(password, hash);
      }
    }
  });

module.exports = User;