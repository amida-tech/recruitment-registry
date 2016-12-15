import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';

import SurveyList from './surveyList';

export class SurveysContainer extends Component {

    constructor() {
        super();
    }

    render() {
        return (
            <SurveyList
                data={this.props.data}
                vocab={this.props.vocab}
            />
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