import React, { Component } from 'react';
import Dashboard from './Dashboard';
import { connect } from 'react-redux';

class DashboardContainer extends Component {
  render() {
    return <Dashboard />
  }
}

function mapStateToProps(state, ownProps) {
  return {
    data: state,
    ...ownProps
  }
}

export default connect(mapStateToProps)(DashboardContainer)
