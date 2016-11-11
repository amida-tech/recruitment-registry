import Home from './home/index';
import { LoginContainer } from './login';
import { RegisterContainer } from './register';
import { ProfileContainer } from './profile';
import SurveyBuilderContainer from './surveyBuilder/components/index';
import { SurveyListContainer } from './surveylist';
import { SurveyContainer } from './survey';
import { DashboardContainer } from './Dashboard';

export default [
  { path: '/', title: 'Home', transTerm: 'HOME', component: Home, requiresAuth: false },
  { path: '/login', title: 'Login', transTerm: 'LOGIN', component: LoginContainer, requiresAuth: false, newUsers: true },
  { path: '/register', title: 'Register', transTerm: 'REGISTER', component: RegisterContainer, requiresAuth: false, newUsers: true },
  { path: '/profile', title: 'Profile', transTerm: 'PROFILE', component: ProfileContainer, requiresAuth: true, newUsers: false },
  { path: '/survey-builder(/:id)', title: 'Survey Builder', transTerm: 'SURVEY_BUILDER', component: SurveyBuilderContainer, requiresAuth: true, newUsers: false, isSuper: true },
  { path: '/surveys', title: 'Surveys', transTerm: 'SURVEYS', component: SurveyListContainer, requiresAuth: true, newUsers: false },
  { path: '/survey/:id', title: 'Survey', transTerm: 'SURVEY', component: SurveyContainer, requiresAuth: true, newUsers: false },
  { path: '/dashboard', title: 'Dashboard', transTerm: 'DASHBOARD', component: DashboardContainer, requiresAuth: true, newUsers: false }
];
