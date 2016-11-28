import React, { Component } from 'react';
import { connect } from 'react-redux';
import Consent from './Consent';
import * as actions from '../actions';

class ConsentContainer extends Component {
  componentDidMount() {

    this._getConsentDocs();
  }
  render() {
    return <Consent
      signConsent={this._signConsentDoc}
    />
  }
  _getConsentDocs() {
    this.props.dispatch(actions.requestConsentDocuments());
  }
  _signConsentDoc(consentId) {
    this.props.dispatch(actions.signConsent(consentId));
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    ...state,
    ...ownProps
  }
};

export default connect(mapStateToProps)(ConsentContainer);
