let users;
let localStorage = global.window.localStorage;

var server = {
  init() {
    if (localStorage.users === undefined) {
      const defaultUsername = "admin";
      users = {
        [defaultUsername]: {
          password: "pass"
        }
      };
      localStorage.users = JSON.stringify(users);
    } else {
      users = JSON.parse(localStorage.users);
    }

  },
  login(username, password, callback) {
    const userExists = this.doesUserExist(username);
    if (userExists && password === users[username].password) {
      if (callback) callback({
        authenticated: true,
        token: Math.random().toString(36).substring(7)
      });
    } else {
      var error;
      if (userExists) {
        error = {
          type: "password-wrong"
        }
      } else {
        error = {
          type: "user-doesnt-exist"
        }
      }
      if (callback) callback({
        authenticated: false,
        error: error
      });
    }
  },
  register(data, callback) {
    if (!this.doesUserExist(data.username)) {
      users[data.username] = data;
      localStorage.users = JSON.stringify(users);
      if (callback) callback({
        registered: true
      });
    } else {
      if (callback) callback({
        registered: false,
        error: {
          type: "username-exists"
        }
      });
    }
  },

  logout(callback) {
    localStorage.removeItem('token');
    if (callback) callback();
  },

  doesUserExist(username) {
    return !(users[username] === undefined);
  }
}

server.init();

module.exports = server;