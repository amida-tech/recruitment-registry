# Recruitment Registry API

Recruitment Registry API

## Features

- Node.js v6
- Express
- Sequelize (Postgres)
- Mocha + Chai + SuperTest
- Grunt

## Installation

1. Install Node.js v6 - previous node versions may require Babel
2. Install a Sequelize compatible relational database - currently all testing is being done on Postgres 9.4
3. Create a database `recreg`
4. Install Grunt
5. Install dependencies: `npm install`
6. Create a `.env` file in this directory

## Windows Caveat

Due to variances between Windows and Linux and Mac OSes, Windows users will have to add a few steps for
installing the needed components for node-gyp. And all users will probably have to install Python 2.7 as well.

1. Download & install Python 2.7.
2. Set the Environmental Variables for the Python install, including the variable 'PYTHON.'
3. Download & install Visual C++ Build Tools. (http://landinghub.visualstudio.com/visual-cpp-build-tools)
4. Run 'npm config set msvs_version 2015 --global'
5. If errors continue to occur, update to the latest version of npm with 'npm install npm -g'

## Configuration

1. Use `export NODE_ENV='development` (or `production` or `test`) to set node environment
2. A minimal sample `.env` file is below.  Change according to your database
```
RECREG_DB_DATABASE=recreg
RECREG_DB_USER=foouser
RECREG_DB_PW=TDP#2016!
RECREG_DB_HOST=localhost
RECREG_DB_PORT=5432
RECREG_DB_DIALECT=postgres
```

## Commands

`node index.h`

> Run server (default port is 9005)

`grunt`

> First beautifies and lints all files and then runs all tests.

## API

[swagger.json](./swagger.json) describes the API.  You can view by various swagger tools.

When the server running `/doc` path serves API user interface (`localhost:9005/docs` for default settings).

## Database Design

All table and column names are in snake case to follow Postgres convention and for ability to write Postgres queries easily.  All tables have `created_at` columns.  All tables for which records can be updated have an `updated_at` column.  All tables for which records can be soft deleted have a `deleted_at` column.  No record on any table is ever hard deleted.  Currently only a handful of uniqueness contraints are enforced on the database level.  No indexes have been created yet.

### Tables

- `question`: This table stores all questions that are being or can be used in surveys.  Questions can be stand alone, can belong to a survey or can belong to multiple surveys.  Link to surveys (table `survey`) is achieved through `survey_question` table.  Questions can be updated and soft deleted.  Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first question in the group.  Actual data fields are text of the question (column `text`) and type (column `question_type_name`).   

- `question_type`: This table stores available question types. Current supported types are `text`, `bool`, `choice`, and `choices` that respectively correspond to free text questions, yes/no questions, multiple choice questions and composite questions with multiply selectable choices and free text fields. 

- `question_action`: This table stores display texts (colum `text`) and actions (column `type`) of buttons that are shown to the user when interacting with the question on the client.

- `question_choice`: This table stores text (column `text`) of choice in multiple choice question.  Question id is a foreign key (column `question_id`).  To support composite questions that can have multiply selectable choices together with free text fields (ex: a list of check boxes with an free text other field), this table also stores type of choice (column `type`) with currently supported types of `bool` and `text`.  Order of choices for a particular question are preserved using a line item (column `line`).

- `survey`: This table stores all the surveys in the system.  Surveys can be updated and soft deleted. Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first survey in the group.  Questions in the surveys is represented using another table `survey_question`.  Only actual data field is the name (column `name`).

- `survey_question`: This table stores questions in particular surveys.  Each record represents a question (column `question_id`) in a survey (column `survey_id`).  Question order is preserved using field line (column `line`).  Questions can also be marked required (column `required`).

- `answer`: This table stores all the answers to questions.  Each record represents an answer to a question (column question_id) in a survey (column survey_id) by a user (column `user_id`).  Actual answer data can be a choice from question multiple choices (column `question_choice_id`) and/or a free value field (column `value`) whose type is also stored (column `type`).  Current supported types are `text and `bool`.

- `registry_user`: This table store patient demographics (name, email, ethnicity, gender, and zip), role, and login information (username, password, password reset through email token and its expiration date).

- `document_type`: This table is to be renamed `consent_section_type` after a recent requirement change.  It stores all the consent section types.  Actual data are name (column `name`) for programmatic purposes and description (column `description`) for user interface purposes.

- `document`: This table is to be renamed `consent_section` after a recent requirement change.  Currently the only actual data is consent section text content (column `content`).  Each record is of some document section type (column `type_id`).  This table is designed to have at most one active record for each type at any point in time.  All other records of the same types will be in soft deleted state.

- `document_signature`: This table is to be renamed `consent_signature` after a recent requirement change.  This table stores each instance (column `created_at`) of a user (column `user_id`) signing a consent section (column `document_id`).  

- `registry`: This table stores registry level settings and includes only one record.  Currenly only data is the survey that is being used in user registration (column `profile_survey_id`).

- `ethnicity`: This stores the choices that should be shown to user for ethnicity demographics field.

- `gender`: This stores the choices that should be shown to user for gender demographics field.

In very near future there will be one or two tables to store consent documents (composite of consent sections).  Also there will be additional tables to support internationalization.

## References

- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [Grunt](http://gruntjs.com/)
- [Sequelize](http://docs.sequelizejs.com/en/v3/)
- [Postgres](https://www.postgresql.org/)
- [Mocha](http://mochajs.org/)
- [Chai](http://chaijs.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Babel](http://babeljs.io/)
- [Swagger](http://swagger.io/)
