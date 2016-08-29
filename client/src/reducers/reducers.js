import { CHANGE_FORM, SET_AUTH, SENDING_REQUEST } from '../constants/appConstants';
import { LOCATION_CHANGE } from 'react-router-redux';
const assign = Object.assign || require('object.assign');
import auth from '../utils/auth';

const initialState = {
  title: 'Recruitment Registry',
  formState: {
    username: '',
    password: ''
  },
  currentlySending: false,
  loggedIn: auth.loggedIn()
};

export function homeReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_FORM:
      return assign({}, state, {
        formState: action.newState
      });
    case SET_AUTH:
      return assign({}, state, {
        loggedIn: action.newState
      });
    case SENDING_REQUEST:
      return assign({}, state, {
        currentlySending: action.sending
      });
    default:
      return state;
  }
}

export function routing(state = initialState, action) {
  switch (action.type) {
    case LOCATION_CHANGE:
      return state.merge({ locationBeforeTransitions: action.payload })
    default:
      return state;
  }
}