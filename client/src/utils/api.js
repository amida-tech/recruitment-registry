import request from 'superagent';

var apiUrl = 'http://localhost:9005/api/v1.0';

const apiProvider = store => next => action => {
  next(action)
  switch (action.type) {
    case 'GET_USER':
      request
        .get(apiUrl + '/users/me')
        .set("Authorization", "Bearer " + store.getState().loggedIn)
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
      break
    case 'GET_ETHNICITIES':
      request
        .get(apiUrl + '/ethnicities')
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_ETHNICITIES_SUCCESS',
              payload: response.body
            })
          } else {
            next({type: 'GET_ETHNICITIES_ERROR'})
          }
        })
      break
    case 'GET_SURVEY':
      request
        .get(apiUrl + '/surveys/empty/' + action.surveyName)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_SURVEY_SUCCESS',
              payload: response.body
            })
          } else {
            next({type:'GET_SURVEY_ERROR'})
          }
        })
      break
    case 'GET_PROFILE':
      request
        .get(apiUrl + '/registries/user-profile/' + action.surveyName)
        .set("Authorization", "Bearer " + store.getState().loggedIn)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_PROFILE_SUCCESS',
              payload: response.body
            })
          } else {
            next({type:'GET_PROFILE_ERROR'})
          }
        })
      break
    case 'REGISTER':
      request
        .post(apiUrl + '/registries/user-profile')
        .send(action.payload)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'REGISTER_SUCCESS'
            })
          }
        })
      break
    default:
      break
  }

};

export default apiProvider