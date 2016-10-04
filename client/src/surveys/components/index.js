import React, { Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import surveys from '../index'

export class SurveysContainer extends Component {
  render() {
    const surveysTmp = this.props.data.toJS()
    return (
      <div className="">
        {surveysTmp.map(survey => (<Link key={survey.id} to={'/survey-builder/' + survey.id}>{survey.name}</Link>)) }
      </div>
    )
  }

  componentWillMount() {
    this.props.dispatch({type: 'GET_ALL_SURVEYS'})
  }

  /*_changeChoice(item, evt) {
    var choices = item.question.choices.map((choice) => {
    this.props.dispatch(surveyBuilder.actions.updateQuestion(item.question))
  }*/
}

const mapStateToProps = function(store) {
  return {
    data: store.get('surveys')
  };
}

export default connect(mapStateToProps)(SurveysContainer);