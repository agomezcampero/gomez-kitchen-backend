const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const auth = require('../middleware/auth')
const validateInput = require('../middleware/validateInput')
const {Ingredient, validate} = require('../models/ingredient')

router.post('/', [auth, validateInput(validate)], async (req, res) => {
  res.send('meneh')
})

module.exports = router