import React, { Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import survey from '../index'

export class SurveyContainer extends Component {
  render() {
    //const surveysTmp = this.props.data.toJS()
    return (
      <div className="">
        Off to a good start.
      </div>
    )}

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('survey'),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(SurveyContainer);
