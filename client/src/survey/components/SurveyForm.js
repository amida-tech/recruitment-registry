import React, {Component} from 'react';

import * as SurveyFields from '../../common/SurveyFields';
import * as actions from '../actions';

class SurveyForm extends Component {

    submitAnswers(event){
        event.preventDefault();
        this.props.dispatch(actions.submitAnswers(this.props.surveyAnswers));
    }

    _changeAnswer(event) {
        this.props.dispatch(actions.updateAnswer(event.target.dataset.itype,
            event.target.name, event.target.value, null))
    }

    _changeAnswerChoices(itype, questionId, answerId, value) {
        this.props.dispatch(actions.updateAnswer(itype, questionId,
            answerId, value));
    }

    makeQuestionsJSX(question, index) {
        switch(question.type) {
            case "text":
                return (
                    <div key={question.id} className="container">
                        <label className="special questionNumber">Question {index+1}</label>
                        <SurveyFields.Input
                            id={question.id}
                            changeForm={::this._changeAnswer}
                            text={question.text}
                            required={question.required}/>
                    </div>
                );
            case "bool":
                return (
                    <div key={question.id} className="container">
                        <label className="special questionNumber">Question {index+1}</label>
                        <SurveyFields.Bool
                            id={question.id}
                            changeForm={::this._changeAnswer}
                            text={question.text}
                            vocab={this.props.vocab}
                            required={question.required}/>
                    </div>
                );
            case "choice":
                return (
                    <div key={question.id} className="container">
                        <label className="special questionNumber">Question {index+1}</label>
                        <SurveyFields.Choice
                            id={question.id}
                            changeForm={::this._changeAnswer}
                            text={question.text}
                            vocab={this.props.vocab}
                            choices={question.choices} />
                    </div>
                );
            case "choices":
                return (
                    <div key={question.id} className="container">
                        <label className="special questionNumber">Question {index+1}</label>
                        <SurveyFields.Choices
                            id={question.id}
                            changeForm={::this._changeAnswer}
                            text={question.text}
                            vocab={this.props.vocab}
                            choices={question.choices}
                            changeFormChoices={::this._changeAnswerChoices}
                            required={question.required}/>
                    </div>
                );
        }
    }

    render () {
        const { id, questions } = this.props.selectedSurvey.toJS()
        const surveyAnswers = this.props.surveyAnswers.get('answers');
        const surveyQuestions = this.props.selectedSurvey.get('questions');
        // need to implement: lastUpdated

        var questionnaireJSX = [];


        if(questions){
            questionnaireJSX = questions.map(::this.makeQuestionsJSX);
        }

        return (
            <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
                <ol>
                    {questionnaireJSX}
                </ol>
                <button className="submit">{this.props.vocab.get('SUBMIT')}</button>
            </form>
        )
    }
}

export default SurveyForm;
