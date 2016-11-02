import React, { Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import * as actions from '../actions';

export class SurveysContainer extends Component {

  render() {
    return (
      <div>
        {this.props.vocab.get('AVAIL_SURVEYS')}
        <ul>
          {this.props.data.map(survey => (<li key={survey.id}><Link to={'/survey/' + survey.id}>{survey.name}</Link></li>)) }
        </ul>
      </div>
    )}

  componentWillMount() {
    this.props.dispatch(actions.getAllSurveys());
  }
}

const mapStateToProps = function(state) {
  return {
    data: state.get('surveys'),
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
};

export default connect(mapStateToProps)(SurveysContainer);
