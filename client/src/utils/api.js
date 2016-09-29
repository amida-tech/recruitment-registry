import request from 'superagent'

var apiUrl = 'http://localhost:9005/api/v1.0';
var isFake = false;

var fakeSurvey =  {
  "id": 1,
  "name": "Alz",
  "questions": [
    {
      "id": 1,
      "text": "What's up dawg?",
      "type": "bool",
      actions: [
        {
          type: true,
          text: "not much"
        },
        {
          type: true,
          text: "goin' good"
        },
        {
          type: false,
          text: "not good"
        }
      ]
    },
    {
      "id": 2,
      "text": "Which sides you'd like?",
      "type": "choices",
      "choices": [
        {
          "id": 1,
          "text": "Mayo"
        },
        {
          "id": 2,
          "text": "Ketchup"
        },
        {
          "id": 3,
          "text": "Fries"
        },
        {
          "id": 4,
          "text": "Other",
          type: "text"
        }
      ],
      actions: [
        {
          type: true,
          text: "Done, gimme my burger"
        },
        {
          type: false,
          text: "Changed my mind"
        }
      ]
    }
  ]
}

const apiProvider = store => next => action => {
  next(action)
  switch (action.type) {
    case 'GET_USER':
      request
        .get(apiUrl + '/users/me')
        .set("Authorization", "Bearer " + store.getState().get('loggedIn'))
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
        .get(apiUrl + '/registries/profile-survey/' + action.surveyName)
        .end((error, response) => {
          if (!error) {
            next({
              type: 'GET_SURVEY_SUCCESS',
              payload: (isFake && fakeSurvey) ? fakeSurvey : response.body
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
    default:
      break
  }

};

export default apiProvider