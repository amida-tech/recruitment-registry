import ChartMonitor from 'redux-devtools-chart-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';
import Immutable from 'immutable';
import LogMonitor from 'redux-devtools-log-monitor';
import React from 'react';
import ReactDOM from 'react-dom';
import SliderMonitor from 'redux-slider-monitor';
import createLogger from 'redux-logger';
import { LOCATION_CHANGE, syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { Provider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { combineReducers } from 'redux-immutable'
import { applyMiddleware, compose, createStore } from 'redux';
import { createDevTools, persistState } from 'redux-devtools';
import thunk from 'redux-thunk';
import dataService from './utils/api';


const IS_PROD = process.env.NODE_ENV !== 'development';
const NOOP = () => null;
var visible = false;

let DevTools = IS_PROD ? NOOP : createDevTools(
  <DockMonitor
    toggleVisibilityKey="ctrl-h"
    changePositionKey="ctrl-q"
    changeMonitorKey="ctrl-m"
<<<<<<< HEAD
    fluid="true"
    defaultSize="0"
    defaultIsVisible="false">
=======
    defaultIsVisible={true}>
>>>>>>> origin/develop
      <LogMonitor />
      <SliderMonitor />
      <ChartMonitor />
  </DockMonitor>
);

const initialEnhancers = IS_PROD ? [] : [
  window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument(),
  persistState(location.href.match(/[?&]debug_session=([^&]+)\b/))
];

export default (options) => {
  let {
    initialState = {},
    Layout = NOOP,
    loggerOptions = {},
    middleware = [dataService, routerMiddleware(browserHistory)],
    enhancers = {},
    routes = [],
    reducers = {}
  } = options;


  const frozen = Immutable.fromJS(initialState);

  const routing = (state = frozen, action) => {
    return action.type === LOCATION_CHANGE ?
      state.merge({ locationBeforeTransitions: action.payload }) :
      state;
  };

  const initialMiddleware = [createLogger(loggerOptions)];
  const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

  const appReducer = combineReducers({...reducers, routing})

  const rootReducer = (state, action) => {
    if (action.type === 'LOGOUT') {
      state = frozen
    }

    return appReducer(state, action)
  }

  const store = createStoreWithMiddleware(
    rootReducer,
    frozen,
    compose(
      applyMiddleware(...initialMiddleware, ...middleware),
      ...initialEnhancers,
      ...enhancers
    ));

  const history = syncHistoryWithStore(browserHistory, store, {
    selectLocationState: state => state.has('routing') ? state.get('routing').toJS() : null
  });

  const LayoutWrapper = (props) => (
    <div id="wrapper">
      <Layout {...props} />
      <DevTools />
    </div>
  );

  return {
    store,
    history,
    render(rootElement = document.getElementById('root')) {
      ReactDOM.render(
        <Provider store={store}>
          <Router history={history}>
            <Route component={LayoutWrapper}>
              {routes.map(route => <Route key={route.path} path={route.path} component={route.component} />)}
            </Route>
          </Router>
        </Provider>,
        rootElement
      );
    }
  };
};
