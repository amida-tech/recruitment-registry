import Home from './home/index';
import { ProfileContainer } from './profile';
import SurveyBuilderContainer from './surveyBuilder/components/index';
import { SurveyListContainer } from './surveylist';
import { SurveyContainer } from './survey';
import { AdminSurveyContainer } from './admin/survey';
import { DashboardContainer } from './dashboard';
import { ConsentContainer } from './consent';

export default [
  {
    path: '/',
    title: 'Home',
    transTerm: 'HOME',
    component: Home,
    requiresAuth: false
  }, {
    path: '/profile',
    title: 'Profile',
    transTerm: 'PROFILE',
    component: ProfileContainer,
    requiresAuth: true,
    newUsers: false
  }, {
    path: '/survey-builder(/:id)',
    title: 'Survey Builder',
    transTerm: 'SURVEY_BUILDER',
    component: SurveyBuilderContainer,
    requiresAuth: true,
    newUsers: false,
    isSuper: true
  }, {
    path: '/surveys',
    title: 'Surveys',
    transTerm: 'SURVEYS',
    component: SurveyListContainer,
    requiresAuth: true,
    newUsers: false
  }, {
    path: '/survey/:id',
    title: 'Survey',
    transTerm: 'SURVEY',
    component: SurveyContainer,
    requiresAuth: true,
    newUsers: false
  }, {
    path: '/dashboard',
    title: 'Dashboard',
    transTerm: 'DASHBOARD',
    component: DashboardContainer,
    requiresAuth: true,
    newUsers: false
  }, {
    path: '/consent',
    title: 'Consent',
    transTerm: 'CONSENT',
    component: ConsentContainer,
    requiresAuth: true,
    newUsers: true
  }, {
    path: '/admin/survey/:id',
    title: 'Preview Survey',
    transTerm: 'PREVIEWSURVEY',
    component: AdminSurveyContainer,
    requiresAuth: true,
    newUsers: false
  }
];
