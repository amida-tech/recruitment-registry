import React, { Component} from 'react';
import { connect } from 'react-redux';


import Survey from './Survey';

export class SurveyContainer extends Component {

    constructor() {
        super();
    }

    render() {
        return (
           <Survey 
               selectedSurvey={this.props.selectedSurvey}
               surveyAnswers={this.props.surveyAnswers}
               vocab={this.props.vocab}
               data={this.props.data}
           />
        )
    }


    componentDidMount() {
        const getSurveyByIdAction = {
            type: 'GET_SURVEY_BY_ID',
            payload: this.props.params.id
        };

        this.props.dispatch(getSurveyByIdAction);
    }

}

const mapStateToProps = function(state, ownProps) {
    return {
        data: state.get('survey'),
        selectedSurvey: state.getIn(['survey', 'selectedSurvey']),
        surveyAnswers: state.getIn(['survey', 'surveyAnswers']),
        vocab: state.getIn(['settings', 'language', 'vocabulary']),
        ...ownProps
    };
};

SurveyContainer.propTypes = {
    selectedSurvey: React.PropTypes.object.isRequired,
    surveyAnswers: React.PropTypes.object.isRequired
};

export default connect(mapStateToProps)(SurveyContainer);
