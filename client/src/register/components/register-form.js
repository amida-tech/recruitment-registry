import React, { Component } from 'react'
import Slider from 'react-slick'
import { Link } from 'react-router';
import '../../../node_modules/slick-carousel/slick/slick.scss'

class Form extends Component {
  constructor(props) {
    super(props)
    this.next = this.next.bind(this)
    this.previous = this.previous.bind(this)
  }
  next() {
    this.refs.slider.slickNext()
  }
  previous() {
    this.refs.slider.slickPrev()
  }

  render() {
    var header = (
        <h4>{this.props.vocab.get('LETS_CREATE')}</h4>
    )

    const renderInputField = (id, type, placeholder, label) => (
      <div key={id}>
        {header}
        <div className="rr-question" >
          <label htmlFor={id}>{label}</label>
          <input autoComplete="off" required className="rr-blankline rr-field" id={id} type={type} onChange={this.props.changeForm} />
        </div>
        <div className="rr-controls">
          <button className="buttonPrimary pull-right" onClick={this.next} type="button">{this.props.vocab.get('NEXT')}</button>
          <button className="buttonSecondary" onClick={this.previous} type="button">{this.props.vocab.get('BACK')}</button>
        </div>
      </div>
    )

    const renderSelectField = (id, defaultValue, label, options) => (
      <div key={id}>
        {header}
        <div className="rr-question" >
          <label htmlFor="gender">{label}</label>
          <select required onChange={this.props.changeForm} value={defaultValue} className="rr-blankline rr-field" id={id}>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="rr-controls">
          <button className="buttonPrimary" onClick={this.previous} type="button">{this.props.vocab.get('BACK')}</button>
          <button className="buttonPrimary" onClick={this.next} type="button">{this.props.vocab.get('NEXT')}</button>
        </div>
      </div>
    )

    const renderCheckbox = (surveyId, questionId, choiceId, label) => (
      <div className="checkbox" key={surveyId + '.' + questionId + '.' + choiceId}>
        <label><input type="checkbox"
                      name={surveyId + '.' + questionId + '.' + choiceId}
                      id={surveyId + '.' + questionId + '.' + choiceId}
                      onChange={this.props.changeChoice}
                      value={surveyId + '.' + questionId + '.' + choiceId}/> {label}</label>
      </div>
    )

    const renderChoices = (question) => {
      var checkboxes = question.choices.map(choice => {
        return renderCheckbox(this.props.survey.id, question.id, choice.id, choice.text);
      })

      var buttons

      if (question.actions) {
        buttons = question.actions.map((action, index) => {

          var self = this
          let boundItemClick = !action.type ? () => {
            this.props.onChoicesClear.bind(this, {
              questionId: question.id,
              surveyId: this.props.survey.id
            })()

            self.next()
          } : this.next

          return (
            <button className="btn rr-button m-r-2" onClick={boundItemClick}
                    key={question.id + "." + index}
                    type="button">{action.text}</button>
          )
        })
        buttons = <div className="rr-controls">{buttons}</div>;
      } else {
        var self = this
        let boundItemClick = () => {
          this.props.onChoicesClear.bind(this, {
            questionId: question.id,
            surveyId: this.props.survey.id
          })()
          console.log(self);
          self.next()
        }

        buttons = (
          <div className="rr-controls">
            <button className="btn rr-button m-r-2" onClick={this.next} type="button">{this.props.vocab.get('NEXT')}</button>
            <button className="btn rr-button" onClick={boundItemClick} type="button">{this.props.vocab.get('SKIP')}</button>
          </div>
        )
      }

      return (
        <div className="rr">
          {header}
          <label className="rr-question">{question.text}</label>
          {checkboxes}
          {buttons}
        </div>
      )
    }

    const renderText = (data) => (
      <div>

      </div>
    )

    const renderBool = (question) => {

      var self = this

      let boundItemClickDefault = () => {
        this.props.changeBoolQuestion.bind(this, {
          questionId: question.id,
          surveyId: this.props.survey.id,
          choiceId: '-1'
        })()

        self.next()
      }

      var buttons = question.actions ?
        question.actions.map((action, index) => {

          let boundItemClick

          if (action.type) {
            boundItemClick = () => {
              this.props.changeBoolQuestion.bind(this, {
                questionId: question.id,
                surveyId: this.props.survey.id,
                choiceId: '-1'
              })()

              this.next()
            }
          } else {
            boundItemClick = () => {
              this.next()
            }
          }

          return (<button className="btn rr-button" onClick={boundItemClick}  key={question.id + "." + index} type="button">{action.text}</button>)
        }) :
        [
          <div key={question.id + ".div"} className="rr-controls">
          <button className="btn rr-button m-r-2" key={question.id + ".1"} type="button" onClick={boundItemClickDefault}>{this.props.vocab.get('YES')}</button>
          <button className="btn rr-button" key={question.id + ".2"} onClick={this.next} type="button">{this.props.vocab.get('NO')}</button>
          </div>
        ]

      return (
        <div>
          {header}
          <label className="rr-question">{question.text}</label>
          {buttons}
        </div>
      )
    }

    const renderSlide = (question) => {
      var content = '';

      switch(question.type) {
        case "choices":
          content = renderChoices(question)
          break
        case "text":
          content = renderText(question)
          break
        case "bool":
          content = renderBool(question)
          break
        default:
      }

      return (<div key={question.id}><div>{content}</div></div>)
    }

    var self = this

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

    var slides = this.props.survey.questions.map(question => renderSlide(question))

    var onSubmit = (evt) => {
      evt.preventDefault();

    }

    return(
      <form autoComplete="off">
          <div className="registry-specific register--inputContainer">
            {
              this.props.survey.questions.length > 0 ? (
                <Slider ref='slider' {...settings}>
                  {renderInputField("username", "text", "admin", this.props.vocab.get('MY_USERNAME'))}
                  {renderInputField("password", "password", "••••••••••", this.props.vocab.get('MY_PASSWORD'))}
                  {renderInputField("email", "email", "someone@domain.tld", this.props.vocab.get('MY_EMAIL'))}
                  {renderInputField("zip", "text", "", this.props.vocab.get('MY_ZIP'))}
                  {renderInputField("dob", "date", "mm/dd/yyyy", this.props.vocab.get('MY_DOB'))}
                  {renderSelectField("gender", this.props.data.gender, this.props.vocab.get('MY_GENDER'), this.props.availableGenders)}
                  {renderSelectField("ethnicity", this.props.data.ethnicity, this.props.vocab.get('MY_ETHNIC'), this.props.availableEthnicities)}
                  {slides}
                  <div key="final" className="rr-question">
                    <div className="rr-wrapper m-b-2">
                      <h1 className="rr no-transform">{this.props.vocab.get('THANKS')}</h1>
                    </div>
                    <p>{this.props.vocab.get('ACCOUNT_CREATED')}</p>
                    <a href="/profile" className="btn rr-button" type="button">{this.props.vocab.get('GO_DASHBOARD')}</a>
                  </div>
                </Slider>
              ) : (<div>{this.props.vocab.get('LOADING')}...</div>)
            }
          </div>
      </form>
    );

  }
}

Form.propTypes = {
  onSubmit: React.PropTypes.func.isRequired,
  btnText: React.PropTypes.string.isRequired,
  changeForm: React.PropTypes.func.isRequired,
  data: React.PropTypes.object.isRequired,
  changeChoice: React.PropTypes.func.isRequired
}

export default Form;
