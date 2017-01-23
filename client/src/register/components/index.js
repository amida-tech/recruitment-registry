import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import * as actions from '../actions';
import Slider from 'react-slick';
import '../../../node_modules/slick-carousel/slick/slick.scss';
import * as SurveyFields from '../../common/SurveyFields';
import { SurveyNavigator } from '../../common/SurveyNavigation';

export class RegisterContainer extends Component {
  render() {
    // const { survey } = this.props.data.toJS();
    var slides = [];
    var userInfo = ['username', 'password', 'email'];

    slides = userInfo.map(field => {

      var inputField = (<SurveyFields.Input
        key={field}
        id={field}
        type={field == 'username' ? 'text' : field}
        changeForm={::this._changeUser}
        text={this.props.vocab.get('PICK_'+field.toUpperCase())}
        required={true}/>
      );

      return(
        <div key={'slick.'+ field}>
          <SurveyNavigator
            key={'regNav.'+ field}
            id={'regNav.'+ field}
            location={field}
            final={slides.length}
            vocab={this.props.vocab}
            next={::this._next}
            previous={::this._previous}
            surveyField={inputField}>
          </SurveyNavigator>
        </div>
      );
    });

    // if(survey.questions){
    //   survey.questions.forEach(question => {
    //       var inputField;
    //       switch(question.type) {
    //         case "text":
    //           inputField = (
    //             <SurveyFields.Input key={question.id} id={question.id}
    //               changeForm={::this._changeAnswer} text={question.text}
    //                required={question.required}/>
    //           );
    //           break;
    //         case "bool":
    //           inputField = (
    //             <SurveyFields.Bool key={question.id} id={question.id}
    //               changeForm={::this._changeAnswer} text={question.text}
    //               vocab={this.props.vocab} required={question.required}/>
    //           );
    //           break;
    //         case "choice":
    //           inputField = (
    //             <SurveyFields.Choice key={question.id} id={question.id}
    //               changeForm={::this._changeAnswer} text={question.text}
    //               vocab={this.props.vocab} choices={question.choices}
    //               required={question.required} />
    //           );
    //           break;
    //         case "choices":
    //           inputField = (
    //             <SurveyFields.Choices key={question.id} id={question.id}
    //               changeForm={::this._changeAnswer} text={question.text}
    //               vocab={this.props.vocab} choices={question.choices}
    //               changeFormChoices={::this._changeAnswerText} required={question.required}/>
    //           );
    //           break;
    //       }
    //       slides.push(
    //         <div key={'slick' + question.id}>
    //           <SurveyNavigator
    //           key={'regNav' + question.id}
    //           id={'regNav' + question.id}
    //           location={question.id}
    //           final={survey.questions.length}
    //           vocab={this.props.vocab}
    //           next={::this._next}
    //           previous={::this._previous}
    //           surveyField={inputField}>
    //           </SurveyNavigator>
    //         </div>);
    //     }); //End of question mapping.
    // }

    slides.push(
      <div key="final">
        <p>Thanks</p>
        <p>Your account is created</p>
        <Link to="/profile">Go to My Dashboard</Link>
      </div>
    );

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
        console.log(nextSlide);
        if (nextSlide === 3) {
          this._submitRegister()
        }
      }
    };
    return(
      <div className="register">
        <div id="utility--background" className="blue"></div>
        <p className="subtitle">{this.props.vocab.get('LETS_CREATE')}</p>
        <div className="register--inputContainer">
          <form className="form" autoComplete="off">
            {
              slides.length > 0 ? (
                <Slider ref='slider' {...settings}>
                  {slides}
                </Slider>
              ) : (<div>{this.props.vocab.get('LOADING')}...</div>)
            }
          </form>
        </div>
      </div>
    );
  }

  _next(event) { //This is some crap to get around the slider instead of a form.
    var given = document.getElementById(event.target.value);
    if(!given.checkValidity() || given.value == 'x' || given.value == undefined){
      alert("Please enter a valid value for this.")
    } else {
      this.refs.slider.slickNext();
    }
  }
  _previous() {
    this.refs.slider.slickPrev();
  }

  _changeUser(event){
    this.props.dispatch(actions.updateUser(event.target.id, event.target.value));
  }

  _changeAnswer(event) {
    this.props.dispatch(actions.updateAnswer(event.target.dataset.itype,
      event.target.id, event.target.value, event.target.name));
  }

  _changeAnswerText(questionId, answerId, value) {
    this.props.dispatch(actions.updateAnswer('choices.text', questionId,
      answerId, value));
  }

  _submitRegister(){
    // Make this an actual action in actions.
    this.props.dispatch({
    type: 'REGISTER',
    payload: this.props.data.getIn(['newUserProfile', 'user'])
      // Get rid of the ones below this line.
      // registryName: 'Alzheimer',
      // answers: this.props.data.getIn(['newUserProfile', 'answers']),
    });
  }

  componentWillMount() {
    this.props.dispatch(actions.getSurvey());
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('register'),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
};

export default connect(mapStateToProps)(RegisterContainer)
