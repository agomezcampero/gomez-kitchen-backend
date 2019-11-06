const express = require('express')
const error = require('../middleware/error')
const users = require('../routes/users')
const auth = require('../routes/auth')
const ingredients = require('../routes/ingredients')

module.exports = function (app) {
  app.use(express.json())
  app.use('/api/users', users)
  app.use('/api/auth', auth)
  app.use('/api/ingredients', ingredients)

  app.use(error)
}