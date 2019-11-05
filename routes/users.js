const { User, validate } = require('../models/user')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const validateInput = require('../middleware/validateInput')

router.post('/', validateInput(validate), async (req, res) => {
  let user = await User.findOne({ email: req.body.email })
  if (user) return res.status(400).send('User already registered')

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  })

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(user.password, salt)
  await user.save()

  const token = user.generateAuthToken()

  res.send({
    name: user.name,
    email: user.email,
    token: token
  })
})

module.exports = router