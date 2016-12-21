import React, {Component} from 'react';
import { Link } from 'react-router';


class SurveyListSection extends Component {
    constructor() {
        super();
    }

    render() {
        return (
            <section id={this.props.cssId}>
            <span className="label">
                {this.props.title}
            </span>
                {this.props.surveys.map(survey => (
                    <li>
                        <img />
                        <div className="flag"></div>
                        <span className="title">{survey.name}</span>
                        <br/>
                        <p>Fusce ut massa eu dolor convallis eleifend ut sed eros. Duis enim nisi, efficitur
                            eu elit sed, facilisis sodales ex. Nulla pulvinar, metus vitae luctus vulputate,
                            sapien ex iaculis nisl, sed consequat erat lorem a felis. In nec fringilla
                            ligula. Ut ut turpis eu nulla laoreet porttitor vel nec tellus. Sed sed laoreet
                            nisl. Maecenas augue nunc, suscipit sed nulla non, mattis malesuada magna.
                            Mauris quis dignissim nibh.</p>
              <span className="timeEstimate">
                <span><span className="label">Time Needed:<br/></span>30 Minutes</span>
              </span>
                        <Link to={'/survey/' + survey.id}>Start Section</Link>
                    </li>)) }
            </section>
        )
    }
}


export default SurveyListSection;