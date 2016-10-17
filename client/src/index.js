import App from './app'
import routes from './routes'
import Layout from './layout/index'
import Background from './background/index'
import login from './login'
import register from './register'
import profile from './profile'
import surveyBuilder from './surveyBuilder'
import surveys from './surveys'
import { browserHistory } from 'react-router'
import Immutable from 'immutable'

export const initialState = {
  title: "GAP",
  settings: {
    language: {
      choice: localStorage.choice ? localStorage.choice : 'en',
      vocabulary: localStorage.vocabulary ? localStorage.vocabulary : require('./i18n/en.json')
    }
  },
  login: {
    formState: {
      hasErrors: false,
      username: '',
      password: ''
    },
    user: localStorage.user ? JSON.parse(localStorage.user) : {
      username: "",
      role: "",
      id: ""
    }
  },
  register: {
    formState: {
      username: '',
      password: '',
      ethnicity: 'Caucasian',
      gender: 'male'
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
    ],
    survey: {
      questions: []
    },
    surveyResult: {
      answers: []
    }
  },
  loggedIn: localStorage.token ? localStorage.token : false,
  profile: {
    user: {
      name: ""
    },
    survey: {
      questions: []
    }
  },
  surveyBuilder: {
    survey: {
      name: '',
      questions: [],
      released: true
    }
  },
  surveys: []
};

export const reducers = {
  [login.constants.NAME]: login.reducer,
  [register.constants.NAME]: register.reducer,
  [profile.constants.NAME]: profile.reducer,
  [surveyBuilder.constants.NAME]: surveyBuilder.reducer,
  [surveys.constants.NAME]: surveys.reducer,
  loggedIn: (state = initialState, action) => {
    switch (action.type) {
      case "LOGIN_SUCCESS":
        browserHistory.push('/')
        localStorage.setItem("token", action.data.token)
        return action.data.token
      case "LOGOUT":
        browserHistory.push('/login')
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        return false
      default:
        return state
    }
  },
  title: (state = initialState) => state,
  settings: (state = initialState, action) => {
    switch (action.type) {
      case "CHANGE_LANGUAGE":
        var choice = state.getIn(['language','choice']) == 'en' ? 'es' : 'en';
        return state.setIn(['language'], Immutable.fromJS({'choice': choice, 'vocabulary': require('./i18n/'+choice+'.json')}));
      default:
        return state;
      }
    }
};

import './styles/main.scss'

App({ reducers, initialState, Layout, Background, routes }).render()
