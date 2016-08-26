process.env.NODE_ENV = 'test';

const UserModel = require('../../user/model');
const config    = require('../../config');
const request   = require('supertest');

let server;
let jwt;

let user = {
  email: 'test@amida-tech.com',
  password: UserModel.hashPassword('password', 10)
};

describe('Starting API Server', function() {

  before(function() {
    server = require('../../app').listen(3006);
  });

  after(function(){
    UserModel.destroy({where: {email: user.email}}).then(function(){
      server.close();
    });
  });

  it('Creates a user via REST api.', function createUser(done) {
    request(server)
      .post('/api/v1.0/user')
      .send({email: user.email, password: "password"})
      .expect(201, done)
  });

  it('Authenticates a user and returns a JWT', function createToken(done) {
    request(server)
      .get('/api/v1.0/user/token')
      .auth(user.email, 'password')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        jwt = res.body.token;
        done();
      });
  });

  it('Returns a user\'s own data after authenticating the API', function showUser(done) {
    request(server)
      .get('/api/v1.0/user')
      .set('Authorization', 'Bearer ' + jwt)
      .expect(200, {
        email: 'test@amida-tech.com',
        admin: false
      }, done);
  });
});