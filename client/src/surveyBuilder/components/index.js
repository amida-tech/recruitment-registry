import React, { Component} from 'react';
import { connect } from 'react-redux';
import surveyBuilder from '../index';
import Toolbox from './toolbox'

export class SurveyBuilderContainer extends Component {
  render() {
    const formState = this.props.data.get('formState')
    return (
      <div className="form-page__wrapper">
        <div className="form-page__form-wrapper">
          <Toolbox></Toolbox>
        </div>
      </div>
    );
  }
  _changeForm(evt) {
    // this.props.dispatch(login.actions.update(evt.target.id, evt.target.value))
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('login')
  };
}

export default connect(mapStateToProps)(SurveyBuilderContainer);