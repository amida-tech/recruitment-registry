import React, { Component } from 'react';
import { connect } from 'react-redux';
import Consent from './Consent';

class ConsentContainer extends Component {
  render() {
    return <Consent />
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    data: state,
    ...ownProps
  }
};

export default connect(mapStateToProps)(ConsentContainer);
