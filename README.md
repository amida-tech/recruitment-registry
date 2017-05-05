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
2. Install and initialize Postgres v9.5 or better
3. Create a database `createdb recreg`
4. Install Grunt
5. Cd into api directory and install dependencies: `npm install`
6. Create a `.env` file in the root level of this directory
7. Run sync file:
  `node seed.js`
8. Run program:
`npm start`

## Windows Caveat

Due to variances between Windows and Linux and Mac OSes, Windows users will have to add a few steps for
installing the needed components for node-gyp. And all users will probably have to install Python 2.7 as well.

1. Download & install Python 2.7.
2. Set the Environmental Variables for the Python install, including the variable 'PYTHON.'
3. Download & install Visual C++ Build Tools. (http://landinghub.visualstudio.com/visual-cpp-build-tools)
4. Run 'npm config set msvs_version 2015 --global'
5. If errors continue to occur, update to the latest version of npm with 'npm install npm -g'

## Configuration

Use `export NODE_ENV=development` (or `production` or `test`) to set node environment in Bash compatible shells or equivalent in others.

Add to `PATH` `export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin`. Note: You'll have to preform this operation for each new shell session, or add the Postgres  `bin` file to your `$PATH` variable.

A minimal sample `.env` file is below.  Change according to your database
```
RECREG_DB_NAME=recreg
RECREG_DB_USER=postgres
RECREG_DB_PASS=postgres
RECREG_DB_HOST=localhost
RECREG_DB_PORT=5432
RECREG_DB_DIALECT=postgres
RECREG_DB_POOL_MAX=5
RECREG_DB_POOL_MIN=0
RECREG_DB_POOL_IDLE=10000
RECREG_LOGGING_LEVEL=emerg
RECREG_CLIENT_BASE_URL="http://localhost:4000/reset-tokens/"
RECREG_CORS_ORIGIN=http://localhost:4000
RECREG_ZIP_BASE_URL="http://www.zipcodeapi.com/rest/"
RECREG_ZIP_API_KEY=xxx
RECREG_ZIP_DISTANCE=50
RECREG_ZIP_UNITS=mile
```

A list of full environment variable settings is below.  They can be either manually set in the shell or can be included in the `.env` file.  Defaults indicated in paranthesis.

- RECREG_CLIENT_SECRET: Secret for JWT encryption ('this is a secret' for development and test).
- RECREG_PORT: Port for the API server (9005).
- RECREG_DB_NAME: Database name (recreg for development and production, recregtest for test).
- RECREG_DB_USER: Database user (no default).
- RECREG_DB_PASS: Database password (no default).
- RECREG_DB_HOST: Database host ip (localhost).
- RECREG_DB_PORT: Database host port (5432).
- RECREG_DB_SCHEMA: Database schema in postgres sense.  This can be either a single schema name or '~' delimited string of multi tenant schema names.
- RECREG_DB_DIALECT: Database dialect (postgres only, see [here](#postgredepend)).
- RECREG_DB_POOL_MAX: Maximum number of connections in pool.
- RECREG_DB_POOL_MIN: Minimum number of connections in pool.
- RECREG_DB_POOL_IDLE: The maximum time, in milliseconds, that a connection can be idle before being released.
- RECREG_SUPER_USER_USERNAME: Super user username (super).
- RECREG_SUPER_USER_PASSWORD: Super user password (Am!d@2017PW).
- RECREG_SUPER_USER_EMAIL: Super user email (rr_demo@amida.com).
- RECREG_LOGGING_LEVEL: Logging level (info).
- RECREG_CRYPT_HASHROUNDS: Number of rounds for hashing user passwords (10).
- RECREG_CRYPT_RESET_TOKEN_LENGTH: Length for reset password token (20).
- RECREG_CRYPT_RESET_PASSWORD_LENGTH: Length for temporary random password during reset (10).
- RECREG_CRYPT_RESET_EXPIRES: Reset password expires value in seconds (3600).
- RECREG_CLIENT_BASE_URL: Base client url for password reset (no default).
- RECREG_CORS_ORIGIN: Client URIs that the API CORS setup will accept. Delimited by spaces for multiple URIs e.g. "http://localhost:4000 https://www.example.com"
- RECREG_CONSTANT_CONSTANT_TOKEN: Access token for Constant Contact API.
- RECREG_CONSTANT_CONTACT_KEY: API key for Constant Contact API.
- RECREG_CONSTANT_CONTACT_LIST_ID: Unique identifier for Constant Contact list
- RECREG_ZIP_BASE_URL: Base API URL for Zipwise zip code API. Set to `https://www.zipwise.com/webservices/radius.php`.
- RECREG_ZIP_API_KEY: API key for Zipwise.
- RECREG_ZIP_DISTANCE: Distance to query when finding zip code vicinities (`50`).
- RECREG_JWT_<registry name>: JWT for remote registries for federated search.

## Commands

`npm start`

> Run server (default port is 9005)

`grunt`

> First beautifies and lints all files and then runs all the tests.

`npm test`

> Runs all the tests.

`npm run-script coverage`

> Runs all the tests and displays coverage metrics.

## Multitenant Support

Multitenancy is supported through postgres schemas.  Multiple schemas are specified using RECREG_DB_SCHEMA as a '~' delimited string of schema names.  This project assumes that each schema has the same table structure during database synchronization.  Schema names are appended to the base url for each API end point so that each tenant can be accessed using a different path.

## Tests

This project primarily uses [Mocha](http://mochajs.org/), [Chai](http://chaijs.com/) and [Super Test](https://github.com/visionmedia/supertest) for automated testing.  [Sinon](http://sinonjs.org/) is also used in a couple of tests when it is absolutely necessary to use stubs.  Stubbing in general however is avoided.

All tests are located in `test` directory in a mostly flat directory structure.  All API entries both get a HTTP integration test and an equivalent model test.  Unit tests for other utility modules are also included in the root directory.  In addition `test/use-cases` directory includes informative tests designed to instruct how to use the API from a client.

Individual test suites can be run using mocha

```
$ mocha test/survey.model.spec.js --bail
```

Each test in a file may depend on some of the previous tests so using flag `bail` is recommended.

Most API resources are documented in snippets in the [integration document](./docs/api.md).  A script that exercises most snippets is.  This script however is not yet part of the testing suite and needs to be run independently and updated according to changes.

## API

File [swagger.json](./swagger.json) describes the API.  There are various [swagger](http://swagger.io/) tools such as [swagger-codegen](https://github.com/swagger-api/swagger-codegen) that can be used view or generate reports based on this file.

When the recruitment-registry api server is running `/docs` resource serves Swagger-UI as the API user interface (`localhost:9005/docs` for default settings).  However due to current limited support for JWT, Swagger-UI mostly works as documentation and resources that require authorization can not be run.

Detailed description of the API with working examples is provided in the [integration document](./docs/api.md).

## Database Design

### General

All table and column names are in snake case to follow Postgres convention and for ability to write Postgres queries easily.  All tables have `created_at` columns.  All tables for which records can be updated have an `updated_at` column.  All tables for which records can be soft deleted have a `deleted_at` column.  If there is a timestamp value at the `deleted_at` column, the record is soft deleted.  No record on any table is ever hard deleted.  Currently only a handful of uniqueness contraints are enforced on the database level.  No indexes have been created yet.

### Multi Lingual Support

This is a English first design where all logical records are assumed to be in English when first created.  Once a record is created any user facing text column (those users see in the user interface) can be translated to any language.  For each table English and translated versions of user facing text colums are stored in an axuilliary table whose name is the name of the actual table postfixed with `_text` (Ex: `question` and `question_text`).

### Tables

- `language`: Each record in this table represents a supported language.  `code` column is used as the primary key and designed to store two or three character ISO codes.  Columns `name` and `native_name` can be used for language selection on the client.

- `question`: Each record in this table represents a question that is being or can be used in surveys .  Questions can be stand alone, can belong to a survey or can belong to multiple surveys.  Link to surveys (table `survey`) is achieved through `survey_question` table.  Question records can be soft deleted but when no other active record in any other table does not reference it.  Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first question in the group.  Only actual data column in this table is `type`.

- `question_text`: This table stores translatable logical question field `text` in the column with the same name.  `language` is also a column and each record has a value for `text` in that language.  `question_id` column links each record to `question` table.

- `question_type`: This table stores available question types. Current supported types are `text`, `bool`, `choice`, and `choices` that respectively correspond to free text questions, yes/no questions, multiple choice questions and composite questions with multiply selectable choices and free text fields.

- `question_choice`: Each record in this table represents a choice in multiple choice question of types choice or choices.  Question id is a foreign key (column `question_id`).  To support composite questions that can have multiply selectable choices together with free text fields (ex: a list of check boxes with a free text other field), this table also stores type of choice (column `type`) with currently supported types of `bool` and `text`.  Order of choices for a particular question is preserved using a line item (column `line`).  Actual text of choice is stored in `question_choice_text`.

- `question_choice_text`: This table stores translatable column `text` which stores question choice texts. `language` is also column and each record has a value for `text` in that language. `question_choice_id` column links each record to `question_choice` table.

- `survey`: Each record in this table represents a survey.  Surveys can be deleted. Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first survey in the group.  Questions in surveys are represented using another table `survey_question`.  Only actual data column is `meta` which is designed to store client settings.

- `survey_text`: This table stores translatable column `name` which stores survey name. `language` is also a column and each record has a value for `name` in that language. `survey_id` column links each record to `survey` table.

- `survey_question`: This table stores questions in particular surveys.  Each record represents a question (column `question_id`) in a survey (column `survey_id`).  Question order is preserved using field line (column `line`).  Questions can also be marked required (column `required`).

- `rr_section`: Each record in this tables represents a section in a survey. Content of sections are represented as local indices of questions in column `indices`.  The name of the section is stored in `section_text` table.

- `section_text`: This table stores translatable column `name` which stores section name. `language` is also a column and each record has a value for `name` in that language.  `section_id` column links each record to `rr_section` table.

- `survey_section`: This table links surveys (column `survey_id`) to sections (column `section_id`).  Order of sections preserved using column `line`.

- `answer`: This table stores all the answers to questions.  Each record represents an answer to a question (column `question_id`) in a survey (column `survey_id`) by a user (column `user_id`).  Actual answer data can be a choice from question multiple choices (column `question_choice_id`) and/or a free value field (column `value`) whose type is also stored (column `type`).  Current supported types are `text`, `bool` or `choice`.

- `answer_type`: This table stores available answer types. Current supported types are `text`, `bool` and `choice`.

- `registry_user`: This table stores patient email, role, and login information (username, password, password reset through email token and its expiration date).

- `consent_type`: Each record in this table represent a consent document type.  Column `name` is used in API tp refer to the consent type and column `type` is client only field that identify how consent documents of this type are presented on the user interface. Title for the consent type is stored in `consent_type_text`.

- `consent_type_text`: This table stores translatable column `title` which stores consent type title. `language` is also a column and each record has a value for `title` in that language.  `consent_type_id` column links each record to `consent_type` table.

- `consent_document`: Each record in this table represents a consent document.  This table is designed to have at most one active record for each consent type at any point in time.  All other records of the same types will be in soft deleted state.  Actual content of the consent documents are stored in `consent_document_text`.

- `consent_document_text`: This table stores translatable columns `content` and `update_comment` of consent documents.  `language` is also a column and each record has values for `content` and `update_comment` in that language.  `consent_document_id` column links each record to `consent_document` table.

- `consent_signature`: This table stores each instance (column `created_at`) of a user (column `user_id`) signing a consent document (column `consent_document_id`).  This table also stores ip (column `ip` and browser information (column `user_agent`) during the signing of the document.

- `consent`: Each record in this table represents a collection of consent documents.  Column `name` is used to identify the collection in API but otherwise this table does not have a data column.

- `consent_section`: Each record in this table represents a section of consent type (column `consent_type_id`) in consent (column `consent_id`).  Column `line` is used preserve order.

- `survey_consent_type`: Each record represents a consent section (column `consent_type_id`) that needs to signed by a user before a survey (column `survey_id`) can be read, submitted or edited (column `action`).  Functionality related to this table is not currently activated.

- `profile_survey`: This table stores profile survey; a survey which is can be used during registration to collect information from participants.  At any time only one active record exists.

- `user_survey`: This table stores status of a survey for a participant.  The status can be `in-progress` or `completed`.

- `smtp`: This table stores email service specifics that are used for password reset functionality.  At any point it only contains one active record.  The subject and content of password reset email are stored in `smtp_text`.

- `smtp_text`: This table stores translatable columns `content` and `subject` for password reset email.

### Record Updates

Except account columns `email` and `password` in users table, none of the user facing columns ever overwrite a previous value and a history is always available.  There are a few overwriting columns such as `meta` in `survey` table.  These are mainly used for client level settings and do not contribute to any business logic.

## Migration

This project uses [sequelize-cli](https://github.com/sequelize/cli) for migrations.  The bootstrap model is located [here](./migration/models) and corresponds to the state of the database during first go-live.

All migrations can be run using sequelize-cli](https://github.com/sequelize/cli) in migration directory
```bash
cd migration
sequelize
```

Migration uses the `.env` file in the root directory.  Each run creates/updates a file named `sequelize-meta.json` in the migration directory.  This file must be preserved in this directory to avoid running the same migrations again.

## References

- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [Grunt](http://gruntjs.com/)
- [Sequelize](http://docs.sequelizejs.com/en/v3/)
- [Sequelize-Cli](https://github.com/sequelize/cli)
- [Postgres](https://www.postgresql.org/)
- [Sinon](http://sinonjs.org/)
- [Mocha](http://mochajs.org/)
- [Chai](http://chaijs.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Babel](http://babeljs.io/)
- [Swagger](http://swagger.io/)
