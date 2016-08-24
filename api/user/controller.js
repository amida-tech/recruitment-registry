const User = require('./model');
const bcrypt = require('bcrypt');

const userController = {
  create: (req, res) => {
    createUserIfNonExistent(res, req.body.email, req.body.password);
  }
};

//TODO: refactor callback hell with co or async/await.

const createUserIfNonExistent = (res, email, password) => {
  User.findOne({where:{email}}).then(data => {
    if (data) {
      res.status(400).send('An existing user has already used that email address.');
    } else {
      User.create({
        email,
        password: bcrypt.hashSync(password, 10),
        admin: false
      }).then(user => {
        res.status(201).json({id: user.id, email: user.email});
      });
    }
  });
};

module.exports = userController;