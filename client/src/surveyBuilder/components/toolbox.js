import React, { Component} from 'react';
import { Draggable, Droppable } from 'react-drag-and-drop'


export default class Toolbox extends Component {
  render() {
    return (
      <div>
        <ul>
          <Draggable type="question" data="checkboxes"><li>Checkbox(es)</li></Draggable>
          <Draggable type="question" data="text"><li>Text</li></Draggable>
          <Draggable type="question" data="dropdown"><li>Dropdown</li></Draggable>
        </ul>
        <Droppable
            types={['question']}
            onDrop={this.onDrop.bind(this)}>
          <ul className="Smoothie"></ul>
        </Droppable>
      </div>
    );
  }

  onDrop(data) {
    console.log(data)
  }
}