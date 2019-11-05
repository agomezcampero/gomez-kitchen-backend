const { User, validateForAuth } = require('../models/user')
const validateInput = require('../middleware/validateInput')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')

router.post('/', validateInput(validateForAuth), async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) return res.status(400).send('Invalid email or password')

  const validPassword = await bcrypt.compare(req.body.password, user.password)
  if (!validPassword) return res.status(400).send('Invalid email or password')

  res.send({token: user.generateAuthToken()})
})

module.exports = router