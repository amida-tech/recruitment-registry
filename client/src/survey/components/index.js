import React, { Component} from 'react';
import { connect } from 'react-redux';
import { SurveyInputField, SurveyBoolField, SurveyChoiceField, SurveyChoicesField } from './survey-form';

export class SurveyContainer extends Component {
  render() {
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    var questionnaire = [];
    if(questions){
      questionnaire = questions.map((question) => {
        switch(question.type) {
          case "text":
            return (
              <SurveyInputField key={question.id}
                id={question.id} text={question.text}
                required={question.required}/>
            );
            case "bool":
              return (
                <SurveyBoolField key={question.id}
                  id={question.id} text={question.text}
                  vocab={this.props.vocab} required={question.required}/>
              );
          case "choice":
            return (
              <SurveyChoiceField key={question.id}
                id={question.id} text={question.text}
                choices={question.choices} required={question.required}/>
            );
          case "choices":
            return (
              <SurveyChoicesField key={question.id}
                id={question.id} text={question.text} vocab={this.props.vocab}
                choices={question.choices} required={question.required}/>
            );
        }
      });
    }
    return (
      <div>
        <h1>{name}</h1>
        <div className="">
          {questionnaire}
        </div>
      </div>
    )}

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }
}

const mapStateToProps = function(store) {
  return {
    selectedSurvey: store.getIn(['survey', 'selectedSurvey']),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

SurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired
}

export default connect(mapStateToProps)(SurveyContainer);
