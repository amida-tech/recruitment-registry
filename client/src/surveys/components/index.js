import React, { Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import surveys from '../index'

export class SurveysContainer extends Component {

  render() {
    const surveysTmp = this.props.data.toJS()
    return (
      <div className="">
        {this.props.vocab.get('AVAIL_SURVEYS')}
        <ul>
          {surveysTmp.map(survey => (<li key={survey.id}><Link to={'/surveys/' + survey.id}>{survey.name}</Link></li>)) }
        </ul>
      </div>
    )}

  componentWillMount() {
    this.props.dispatch({type: 'GET_ALL_SURVEYS'})
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('surveys'),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(SurveysContainer);
