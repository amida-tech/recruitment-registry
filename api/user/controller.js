const User = require('./model');
const bcrypt = require('bcrypt');

const userController = {
  createNewUser: (req, res) => {
    createUserIfNonExistent(res, req.body.email, req.body.password);
  },
  showCurrentUser: (req, res) => {
    if (req.user) {
      const currentUser = {
        email: req.user.email,
        admin: req.user.admin
      };
      res.status(200).json(currentUser);
    } else {
      res.status(401);
    }
  }
};

// Create standalone functions for callbacks of each async request.
const createUserIfNonExistent = (res, email, password) => {
  User.findOne({where:{email}}).then(data => {
    if (data) {
      res.status(400).send('An existing user has already used that email address.');
    } else {
      User.create({
        email,
        password: User.hashPassword(password),
        admin: false
      }).then(user => {
        res.status(201).json({id: user.id, email: user.email});
      });
    }
  });
};

module.exports = userController;