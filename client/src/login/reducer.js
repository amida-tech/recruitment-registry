import * as t from './actionTypes';

const assign = Object.assign || require('object.assign');

const initialState = {
  formState: {
    username: '',
    password: '',
    user: localStorage.user ? JSON.parse(localStorage.user) : {
      username: "",
      role: "",
      id: ""
    }
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case t.CHANGE_FORM:
      return assign({}, state, {
        formState: action.newState
      });
    case 'LOGIN_ERROR':
      return assign({}, state, {
        formState: {
          hasErrors: true
        }
      });
    case 'LOGIN_SUCCESS':
      return assign({}, state, {
        formState: {
          hasErrors: false
        }
      });
    case "GET_USER_SUCCESS":
      localStorage.user = JSON.stringify(action.payload)
      return assign({}, state, {
        user: action.payload
      });
    default:
      return state;
  }
}