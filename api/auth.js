const User = require('./user/model');
const bcrypt = require('bcrypt');

module.exports = {
  basicStrategy: function(email, password, done) {
    User.findOne({where: {email}}).then(user => {
      if (user && User.comparePassword(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false);
      }
    });
  },
  jwtStrategy: function(jwt_payload, done) {
    User.findOne({where: {id: jwt_payload.id, email: jwt_payload.email}}).then(user => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }
};