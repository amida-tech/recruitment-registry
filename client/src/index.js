import App from './app';
import routes from './routes';
import Layout from './layout/index';
import Background from './background/index';
import { LoginReducer } from './login';
import { RegisterReducer } from './register';
import { ProfileReducer } from './profile';
import surveyBuilder from './surveyBuilder';
import { SurveyListReducer } from './surveylist';
import { SurveyReducer } from './survey';
import { browserHistory } from 'react-router';
import i18n from './i18n/en.json';

export const initialState = {
  title: "GAP",
  settings: {
    language: {
      choice: 'en',
      vocabulary: i18n
    }
  },
  login: {
    formState: {
      username: '',
      password: '',
    },
    user: {
      username: "",
      role: "",
      id: ""
    }
  },
  loggedIn: false,
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
  surveys: [],
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
  surveys: SurveyListReducer,
  survey: SurveyReducer,
  loggedIn: (state = initialState, action) => {
    switch (action.type) {
      case "LOGIN_SUCCESS":
        return action.data.token;
      case "LOGOUT":
        localStorage.removeItem("rec-reg");
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
