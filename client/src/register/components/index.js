import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './register-form';
import { Link } from 'react-router';
import register from '../index';
import Slider from 'react-slick'
import '../../../node_modules/slick-carousel/slick/slick.scss'
import * as SurveyFields from '../../common/SurveyFields';
import SurveyNavigator from '../../common/SurveyNavigation';

export class RegisterContainer extends Component {
  render() {
    const { formState, survey, availableEthnicities, availableGenders } = this.props.data.toJS();
    var slides = [];
    if(survey.questions){
      slides = survey.questions.map(question => {
        var inputField;
        switch(question.type) {
          case "text":
            inputField = (
              <SurveyFields.Input key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                 required={question.required}/>
            );
            break;
          case "bool":
            inputField = (
              <SurveyFields.Bool key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} required={question.required}/>
            );
            break;
          case "choice":
            inputField = (
              <SurveyFields.Choice key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required} />
            );
            break;
          case "choices":
            inputField = (
              <SurveyFields.Choices key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required}/>
            );
            break;
        }

        slides.push(<SurveyNavigator
          key='regNav'
          id='regNav'
          location={this.props.params.id}
          vocab={this.props.vocab}
          next={::this._next}
          previous={::this._previous}
          surveyField={inputField}>
          </SurveyNavigator>)
      }); //End of question mapping.

      slides.push(
        <div key="final">
          <p>Thanks</p>
          <p>Your account is created</p>
          <Link to="/profile">Go to My Dashboard</Link>
        </div>)
    }

    var settings = {
      dots: false,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      draggable: false,
      accessibility: false,
      useCSS: false,
      beforeChange: (currentSlide, nextSlide) => {
        console.log(currentSlide + " : " + nextSlide)
        if (nextSlide === (7 + this.props.survey.questions.length)) {
          this.props.onSubmit()
          // self.next()
        }
      }
    }

    return(
      <form autoComplete="off">
        <div className="col-lg-6">
          <div className="registry-specific">
            {
              survey.questions.length > 0 ? (
                <Slider ref='slider' {...settings}>
                  {slides}
                </Slider>
              ) : (<div>{this.props.vocab.get('LOADING')}...</div>)
            }
          </div>
        </div>
      </form>
    );
  }

  next() {
    this.refs.slider.slickNext()
  }
  previous() {
    this.refs.slider.slickPrev()
  }

  _changeForm(evt) {
    this.props.dispatch(register.actions.update(evt.target.id, evt.target.value))
  }

  _changeChoice(evt) {
    var dataTmp = evt.target.value.split('.')
    this.props.dispatch(register.actions.updateChoicesAnswer({
      surveyId: dataTmp[0],
      questionId: dataTmp[1],
      choiceId: dataTmp[2]
    }))
  }

  _changeBoolQuestion(data, evt) {
    this.props.dispatch(register.actions.updateChoicesAnswer({
      surveyId: data.surveyId,
      questionId: data.questionId,
      choiceId: data.choiceId
    }))
  }

  _onChoicesClick(data, e) {
    this.props.dispatch(register.actions.clearChoices({
      surveyId: data.surveyId,
      questionId: data.questionId
    }))

    this.next()
  }

  componentWillMount() {
    this.props.dispatch(register.actions.getSurvey())
  }

  _onSubmit(evt) {
    if (evt) evt.preventDefault()

    var answersParsed = []


    var survey = this.props.data.get('survey').toJS()


    survey.questions.forEach((question) => {
      let ans;
      let choices = this.props.data.get('surveyResult').toJS().answers[question.id]
      if (question.type === 'choices') {

        if (choices) {
          choices = Object.keys(choices).filter((key) => {
            return choices[key]
          });
          choices = choices.map((id) => {
            return {
              id: parseInt(id),
              boolValue: true
            }
          });

          ans = { choices: choices }
        } else {
          ans = { choices: [] }
        }

      } else if (question.type === 'bool') {
        var isChecked = !!choices && !!choices['-1']
        ans = { boolValue: isChecked }
        console.log(ans);
      }
      answersParsed.push({
        questionId: question.id,
        answer: ans
      })
    })

    this.props.dispatch({type: 'REGISTER', payload: {
      user: this.props.data.get('formState'),
      registryName: 'Alzheimer',
      answers: answersParsed
    }})
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('register'),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  }
}

export default connect(mapStateToProps)(RegisterContainer)
