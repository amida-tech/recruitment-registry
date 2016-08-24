'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const UserController = require('./user');
const TokenController = require('./token');
const passport   = require('passport');
const auth       = require('./auth');
const BasicStrategy = require('passport-http').BasicStrategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT  = require('passport-jwt').ExtractJwt;
const logger     = require('./logger');
const config     = require('./config');

const app = express();

const jsonParser = bodyParser.json();

const JWTOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('Bearer'),
  secretOrKey: config['development'].jwt.secret
};

passport.use(new BasicStrategy(auth.basicStrategy));
passport.use(new JWTStrategy(JWTOptions, auth.jwtStrategy));

/* Bootstrap Middleware */
app.use(logger);
app.use(jsonParser);
app.use(passport.initialize());
app.use(passport.session());

/* User Routes */
app.post('/api/v1.0/user/create', jsonParser, UserController.create);
app.get('/api/v1.0/user/token', passport.authenticate('basic', {session: false}), TokenController.create);

app.get('/api/v1.0/user', passport.authenticate('jwt', {session: false}), (req, res) => {
  if (req.user) {
    res.status(200).send(req.user.email);
  } else {
    res.status(401);
  }
});

app.listen(8080, function() {
  console.log('Server Started at port 8080');
});
