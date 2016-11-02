import App from './app';
import routes from './routes';
import Layout from './layout/index';
import Background from './background/index';
import login from './login';
import { RegisterReducer } from './register';
import { ProfileReducer } from './profile';
import surveyBuilder from './surveyBuilder';
import surveys from './surveys';
import survey from './survey';
import { browserHistory } from 'react-router';
import Immutable from 'immutable';
import i18n from './i18n/en.json';

export const initialState = {
  title: "GAP",
  settings: {
    language: {
      choice: localStorage.choice || 'en',
      vocabulary: localStorage.vocabulary || i18n // this is redundant with the above value.
    }
  },
  login: login.reducer.initialState,
  loggedIn: localStorage.token || false,
  register: {
    newUserProfile: {
    user: {
      username: '',
      password: '',
      role: 'participant',
      email: ''
    },
    answers: []
  },
    survey: {
      questions: []
    },
    availableEthnicities: [
      "Caucasian",
      "Hispanic",
      "African",
      "Asian"
    ],
    availableGenders: [
      "male",
      "female",
      "other"
    ]
  },
  profile: {
    user: {
      name: ""
    },
    survey: {
      questions: []
    }
  },
  surveyBuilder: surveyBuilder.reducer.initialState,
  surveys: surveys.reducer.initialState,
  survey: survey.reducer.initialState
};

export const reducers = {
  login: login.reducer,
  register: RegisterReducer,
  profile: ProfileReducer,
  surveyBuilder: surveyBuilder.reducer,
  surveys: surveys.reducer,
  survey: survey.reducer,
  loggedIn: (state = initialState, action) => {
    switch (action.type) {
      case "LOGIN_SUCCESS":
        localStorage.setItem("token", action.data.token);
        return action.data.token;
      case "LOGOUT":
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      default:
        return state
    }
  },
  title: (state = initialState) => state,
  settings: (state = initialState, action) => {
    switch (action.type) {
      case "CHANGE_LANGUAGE":
        var choice = state.getIn(['language','choice']) == 'en' ? 'es' : 'en';
        return state.setIn(['language'], {'choice': choice, 'vocabulary': require('./i18n/'+choice+'.json')});
      default:
        return state;
      }
    }
};

import './styles/main.scss'

App({ reducers, initialState, Layout, Background, routes }).render()
