import request from 'superagent';

var apiUrl = 'http://localhost:9005/api/v1.0';

const apiProvider = store => next => action => {
  next(action)
  switch (action.type) {
    case 'GET_USER':
      console.log(store);
      request
        .get(apiUrl + '/users/me')
        .set("Authorization", "Bearer " + store.getState().loggedIn.token)
        .end((error, response) => {
          if (error) {
            return next({
              type: 'GET_USER_ERROR',
              payload: error
            })
          }
          next({
            type: 'GET_USER_SUCCESS',
            payload: response.body
          })
        })
      break
    case 'LOGIN':
      console.log(action);
      request
        .get(apiUrl + '/auth/basic')
        .auth(action.payload.username, action.payload.password)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'LOGIN_SUCCESS',
              data: response.body
            })
            store.dispatch({type: 'GET_USER'})
          } else {
            return next({
              type: 'LOGIN_ERROR',
              error
            })
          }
        })
      break
    case 'ADD_USER':
      request
        .post(apiUrl + '/users')
        .send(action.user)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'ADD_USER_SUCCESS',
              data: response.body
            })
          } else {
            return next({
              type: 'ADD_USER_ERROR',
              error
            })
          }
        })
      break;
    default:
      break
  }

};

export default apiProvider