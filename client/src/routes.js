import Home from './components/pages/home';
import About from './components/pages/about';
import Login from './components/pages/login';
import Register from './components/pages/register';

export default [
  { path: '/', title: 'Home', component: Home },
  { path: '/about', title: 'About', component: About },
  { path: '/login', title: 'Login', component: Login },
  { path: '/register', title: 'Register', component: Register}
];
