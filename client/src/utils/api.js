import request from 'superagent';
import { push } from 'react-router-redux';
import cookie from 'react-cookie';

var apiUrl = 'http://localhost:9005/api/v1.0';

const apiProvider = store => next => action => {
  next(action);
  switch (action.type) {
    case 'GET_USER':
      request
        .get(apiUrl + '/users/me')
        .withCredentials()
        .send({})
        .end((error, response) => {
          next({
            type: 'GET_USER_SUCCESS',
            payload: response.body
          });
        });
      break;
    case 'LOGOUT':
      cookie.remove('rr-jwt-token');
      store.dispatch(push('/login'));
      break;
    case 'LOGIN':
      request
        .get(apiUrl + '/auth/basic')
        .auth(action.payload.username, action.payload.password)
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'LOGIN_SUCCESS',
              data: response.body
            });
            store.dispatch(push('/dashboard'));
          } else {
            return next({
              type: 'LOGIN_ERROR',
              error
            });
          }
        });
      break;
    case 'ADD_USER':
      request
        .post(apiUrl + '/users')
        .withCredentials()
        .send(action.user)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'ADD_USER_SUCCESS',
              data: response.body
            });
          } else {
            return next({
              type: 'ADD_USER_ERROR',
              error
            });
          }
        });
      break;
    case 'GET_ETHNICITIES':
      request
        .get(apiUrl + '/ethnicities')
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_ETHNICITIES_SUCCESS',
              payload: response.body
            });
          } else {
            next({type: 'GET_ETHNICITIES_ERROR'});
          }
        });
      break;
    case 'GET_SURVEY':
      request
        .get(apiUrl + '/profile-survey/')
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_SURVEY_SUCCESS',
              payload: response.body
            });
          } else {
            next({type:'GET_SURVEY_ERROR'});
          }
        })
      break;
    case 'GET_PROFILE':
      request
        .get(apiUrl + '/users/me')
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_PROFILE_SUCCESS',
              payload: response.body
            })
          } else {
            next({type:'GET_PROFILE_ERROR'});
          }
        });
      break;
    case 'SAVE_PROFILE':
      request
        .patch(apiUrl + '/users/me')
        .send(store.getState().getIn(['profile', 'userUpdated']))
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
        .end((error) => {
          if (!error) {
            next({
              type: 'SAVE_PROFILE_SUCCESS'
            });
          } else {
            next({type:'SAVE_PROFILE_ERROR'});
          }
        });
      break;
    case 'REGISTER':
      request
        .post(apiUrl + '/users')
        .send(action.payload)
        .end((error, response) => {
          if (response.body.token) {
            next({
              type: 'LOGIN_SUCCESS',
              data: response.body
            });
            store.dispatch(push('/dashboard'));
            store.dispatch({type: 'GET_USER'});
          }
        });
      break;
    case 'SAVE_SURVEY':
      request
        .post(apiUrl + '/surveys')
        .withCredentials()
        .send(action.payload.toJS())
        .end((error) => {
          if (!error) {
            next({
              type: 'SAVE_SURVEY_SUCCESS'
            });
          } else {
            next({
              type: 'SAVE_SURVEY_ERROR'
            });
          }
        });
      break;
    case 'GET_SURVEY_BY_ID':
      request
        .get(apiUrl + '/surveys/' + action.payload)
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_SURVEY_BY_ID_SUCCESS',
              payload: response.body
            });
          } else {
            next({type:'GET_SURVEY_BY_ID_ERROR'});
          }
        });
      break;
    case 'GET_ALL_SURVEYS':
      request
        .get(apiUrl + '/surveys')
        .withCredentials()
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_ALL_SURVEYS_SUCCESS',
              payload: response.body
            });
          } else {
            next({type:'GET_ALL_SURVEYS_ERROR'});
          }
        });
      break;
    case 'SUBMIT_SURVEY':
      request
        .post(apiUrl + '/answers')
        .withCredentials()
        .send(action.payload.toJS())
        .end((error, response) => {
          if(!error) {
            next({
              type: 'SUBMIT_SURVEY_SUCCESS',
              payload: response.body
            });
            store.dispatch(push('/surveys'));
          } else {
            next({type:'SUBMIT_SURVEY_FAILURE'});
          }
        });
      break;
    default:
      break
  }

};

export default apiProvider
