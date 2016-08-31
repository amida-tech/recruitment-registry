const assign = Object.assign || require('object.assign');
import auth from '../utils/auth';
import { CHANGE_FORM, SET_AUTH, SENDING_REQUEST } from './constants';

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