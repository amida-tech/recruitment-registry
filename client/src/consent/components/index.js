import React, { Component } from 'react';
import { connect } from 'react-redux';
import Consent from './Consent';
import * as actions from './actions';

class ConsentContainer extends Component {
  render() {
    return <Consent />
  }
  _getConsentDocs() {
    this.props.dispatch(actions.getConsentDocs);
  }
  _signConsentDoc(consentId) {
    this.props.dispatch(actions.signConsent(consentId));
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    data: state,
    ...ownProps
  }
};

export default connect(mapStateToProps)(ConsentContainer);
