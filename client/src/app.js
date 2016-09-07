import ChartMonitor from 'redux-devtools-chart-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';
import LogMonitor from 'redux-devtools-log-monitor';
import React from 'react';
import Immutable from 'immutable';
import ReactDOM from 'react-dom';
import SliderMonitor from 'redux-slider-monitor';
import createLogger from 'redux-logger';
import { Provider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { applyMiddleware, compose, createStore, combineReducers } from 'redux';
import { createDevTools, persistState } from 'redux-devtools';
import thunk from 'redux-thunk';


const IS_PROD = process.env.NODE_ENV !== 'development';
const NOOP = () => null;

let DevTools = IS_PROD ? NOOP : createDevTools(
  <DockMonitor
    toggleVisibilityKey="ctrl-h"
    changePositionKey="ctrl-q"
    changeMonitorKey="ctrl-m"
    defaultVisible="false">
      <LogMonitor />
      <SliderMonitor />
      <ChartMonitor />
  </DockMonitor>
);

const initialEnhancers = IS_PROD ? [] : [
  DevTools.instrument(),
  persistState(location.href.match(/[?&]debug_session=([^&]+)\b/))
];



export default (options) => {
  let {
    initialState = {},
    Layout = NOOP,
    loggerOptions = {},
    middleware = [],
    enhancers = {},
    routes = [],
    reducers = {}
  } = options;

  const initialMiddleware = [createLogger(loggerOptions)];

  const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
  const store = createStoreWithMiddleware(
    combineReducers(reducers),
    initialState,
    compose(
      applyMiddleware(...initialMiddleware, ...middleware),
      ...initialEnhancers,
      ...enhancers
    ));

  const frozen = Immutable.fromJS(initialState);

  /*const routing = (state = frozen, action) => {
    return action.type === LOCATION_CHANGE ?
      state.merge({ locationBeforeTransitions: action.payload }) :
      state;
  };*/

  const LayoutWrapper = (props) => (
    <div id="wrapper">
      <Layout {...props} />
      <DevTools />
    </div>
  );

  return {
    browserHistory,
    history,
    render(rootElement = document.getElementById('root')) {
      ReactDOM.render(
        <Provider store={store}>
          <Router history={browserHistory}>
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
