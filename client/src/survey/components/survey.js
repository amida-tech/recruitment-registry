import React, {Component} from 'react';

import SurveyForm from './SurveyForm';



class Survey extends Component {

    constructor() {
        super();
    }
    
    render() {
    
        const { name } = this.props.selectedSurvey.toJS();
        const surveyQuestions = this.props.selectedSurvey.get('questions');
        const surveyAnswers = this.props.surveyAnswers.get('answers');

        return (
            <div id="survey" className="survey columns">
                <div className="column is-3 pull-right">
                    <div className="survey-meta">
                        <h3>Questionnaire</h3>
                        <h1>{name}</h1>
                        <span>
                            { surveyQuestions && (surveyQuestions.size - surveyAnswers.size) }
                            Questions Remaining
                        </span>
                        { this.props.data.get('hasErrors') &&
                            <div>
                                <p>{this.props.vocab.get('SUBMISSION_FAILURE')}</p>
                            </div>
                        }
                    </div>
                </div>
                <div className="column is-6 text-left">
                    <SurveyForm
                        selectedSurvey={this.props.selectedSurvey}
                        surveyAnswers={this.props.surveyAnswers}
                        vocab={this.props.vocab}
                        data={this.props.data}
                    />
                </div>
            </div>
        )
    }


}

export default Survey;