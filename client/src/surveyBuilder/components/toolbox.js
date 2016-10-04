import React, { Component} from 'react';
import { Draggable, Droppable } from 'react-drag-and-drop'
import Guid from 'guid'
import './index.scss';
import ChoicesQuestion from './choices-question'
import BoolQuestion from './bool-question'
import ChoiceQuestion from './choice-question'
import TextQuestion from './text-question'

export default class Toolbox extends Component {


  render() {

    var choicesQuestion = JSON.stringify({
      type: "choices",
      text: "This is a choices question",
      id: undefined,
      choices: [],
      released: true
    })

    var choiceQuestion = JSON.stringify({
      type: "choice",
      text: "This is a choice question",
      id: undefined,
      choices: [],
      released: true
    })

    var textQuestion = JSON.stringify({
      type: "text",
      text: "This is a choice question",
      id: undefined,
      released: true
    })

    var boolQuestion = JSON.stringify({
      type: "bool",
      text: "This is a bool question",
      id: undefined,
      choices: [],
      released: true
    })



    var boolChoice = JSON.stringify({
      id: undefined,
      text: "Choice",
      type: "bool"
    })

    var textChoice = JSON.stringify({
      id: undefined,
      text: "Other",
      type: "text"
    })


    return (
      <div className="survey-builder">
        <div className="row">
          <div className="col-sm-8">
            <div className="form-group"><label>Survey name:
              <input className="form-control" type="text" onChange={::this._changeName} defaultValue={this.props.name}/>
            </label></div>
            <Droppable
              types={['question']}
              onDrop={this._onDropQuestion.bind(this)}>
              <p>To add a question, drag and drop a specific question type from the right toolbox to here</p>
              <ul className="questions">

              </ul>
            </Droppable>
            {this.props.questions.map(question => {
              var questionControl
              switch (question.type) {
                case 'choices': {
                  questionControl = (
                    <ChoicesQuestion question={question}
                                     changeQuestion={::this._changeQuestion}
                                     changeChoice={this.props.changeChoice}
                                     onDropChoice={::this._onDropChoice} />
                  )
                  break
                }
                case 'choice': {
                  questionControl = (
                    <ChoiceQuestion question={question}
                                    changeQuestion={::this._changeQuestion}
                                    changeChoice={this.props.changeChoice}
                                    onDropChoice={::this._onDropChoice} />
                  )
                  break
                }
                case 'text': {
                  questionControl = (
                    <TextQuestion question={question}
                                  changeQuestion={::this._changeQuestion}
                                  changeChoice={this.props.changeChoice}
                                  onDropChoice={::this._onDropChoice} />
                  )
                  break
                }
                case 'bool': {
                  questionControl = (
                    <BoolQuestion question={question}
                                  changeQuestion={::this._changeQuestion}
                                  changeChoice={this.props.changeChoice}
                                  onDropChoice={::this._onDropChoice} />
                  )
                  break
                }
              }

              return (<div className="question">{questionControl}</div>)
            })}
          </div>
          <div className="col-sm-4">
            <ul>
              <Draggable type="question" data={choicesQuestion}>
                <li>Choices</li>
              </Draggable>
              <ul>
                <li><Draggable type="choice" data={textChoice}><p>Text choice</p></Draggable></li>
                <li><Draggable type="choice" data={boolChoice}><p>Bool choice</p></Draggable></li>
              </ul>

              <Draggable type="question" data={choiceQuestion}>
                <li>Choice</li>
              </Draggable>
              <ul>
                <li><Draggable type="choice" data={textChoice}><p>Text choice</p></Draggable></li>
                <li><Draggable type="choice" data={boolChoice}><p>Bool choice</p></Draggable></li>
              </ul>

              <Draggable type="question" data={textQuestion}>
                <li>Text</li>
              </Draggable>

              <Draggable type="question" data={boolQuestion}>
                <li>Bool</li>
              </Draggable>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  _onDropQuestion(data) {
    var question = JSON.parse(data.question);

    if (question) {
      this.props.addQuestion(question);
    }
  }

  _changeName(evt) {
    this.props.updateSurveyName(evt.target.value)
  }

  _changeQuestion(question, event) {
    question.text = event.target.value
    this.props.updateQuestion(question)
  }

  _onDropChoice(question, data) {

    var choice = JSON.parse(data.choice || data.choice);
    choice.id = Guid.raw()

    question.choices.push(choice)

    if (question) {
      this.props.updateQuestion(question);
    }
  }
}