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
