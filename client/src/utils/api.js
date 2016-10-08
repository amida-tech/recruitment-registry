import request from 'superagent'

var apiUrl = 'http://localhost:9005/api/v1.0';

const apiProvider = store => next => action => {
  next(action)
  switch (action.type) {
    case 'GET_USER':
      request
        .get(apiUrl + '/users/me')
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
        .send({})
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
            next({
              type: 'GET_USER'
            })
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
        .get(apiUrl + '/registries/profile-survey/' + action.surveyName)
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
        .get(apiUrl + '/registries/user-profile')
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
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
    case 'SAVE_PROFILE':
      request
        .put(apiUrl + '/users/me')
        .send(store.getState().getIn(['profile', 'userUpdated']))
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
        .end((error) => {
          if (!error) {
            next({
              type: 'SAVE_PROFILE_SUCCESS'
            })
          } else {
            next({type:'SAVE_PROFILE_ERROR'})
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
              type: 'LOGIN_SUCCESS',
              data: response.body
            })
            store.dispatch({type: 'GET_USER'})
          }
        })
      break
    case 'SAVE_SURVEY':
      request
        .post(apiUrl + '/surveys')
        .send(action.payload.toJS())
        .end((error) => {
          if (!error) {
            next({
              type: 'SAVE_SURVEY_SUCCESS'
            })
          } else {
            next({
              type: 'SAVE_SURVEY_ERROR'
            })
          }
        })
      break
    case 'GET_SURVEY_BY_ID':
      request
        .get(apiUrl + '/surveys/' + action.payload)
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_SURVEY_BY_ID_SUCCESS',
              payload: response.body
            })
          } else {
            next({type:'GET_SURVEY_BY_ID_ERROR'})
          }
        })
      break
    case 'GET_ALL_SURVEYS':
      request
        .get(apiUrl + '/surveys')
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_ALL_SURVEYS_SUCCESS',
              payload: response.body
            })
          } else {
            next({type:'GET_ALL_SURVEYS_ERROR'})
          }
        })
      break

    default:
      break
  }

};

export default apiProvider