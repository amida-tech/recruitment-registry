import App from './app';
import routes from './routes';
import Layout from './layout/index';
import Background from './background/index';
import { LoginReducer } from './login';
import { RegisterReducer } from './register';
import { ProfileReducer } from './profile';
import surveyBuilder from './surveyBuilder';
import surveys from './surveys';
import { SurveyReducer } from './survey';
import { browserHistory } from 'react-router';
import i18n from './i18n/en.json';

export const initialState = {
  title: "GAP",
  settings: {
    language: {
      choice: localStorage.choice || 'en',
      vocabulary: localStorage.vocabulary || i18n // this is redundant with the above value.
    }
  },
  login: {
    formState: {
      username: '',
      password: '',
    },
    user: localStorage.user ? JSON.parse(localStorage.user) : {
      username: "",
      role: "",
      id: ""
    }
  },
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
  survey: {
    selectedSurvey: [],
    surveyAnswers: {
      'surveyId': 0,
      'answers': []
    }
  }
};

export const reducers = {
  login: LoginReducer,
  register: RegisterReducer,
  profile: ProfileReducer,
  surveyBuilder: surveyBuilder.reducer,
  surveys: surveys.reducer,
  survey: SurveyReducer,
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
  title: state => state,
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
