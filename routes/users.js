const { User, validate, validateForUpdate, validateForPasswordChange } = require('../models/user')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const validateInput = require('../middleware/validateInput')
const validateObjectId = require('../middleware/validateObjectId')
const auth = require ('../middleware/auth')
const getAll = require('../middleware/getAll')
const _ = require('lodash')

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
    _id: user._id,
    name: user.name,
    email: user.email,
    token: token
  })
})

router.get('/', auth, async (req, res) => {
  res.send(await getAll(req, User))
})

router.get('/me', [auth], async (req, res) => {
  const user = await User.findById(req.user)
  res.send(_.pick(user, ['_id', 'email', 'name']))
})

router.get('/:id', [auth, validateObjectId], async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).send('No user with given id exists')
  res.send(_.pick(user, ['_id', 'name']))
})

router.put('/me', [auth, validateInput(validateForUpdate)], async (req, res) => {
  let user = await User.findById(req.user)

  user.name = req.body.name || user.name
  user.email = req.body.email || user.email

  user.save()

  res.send(_.pick(user, ['_id', 'email', 'name']))
})

router.put('/me/password', [auth, validateInput(validateForPasswordChange)], async (req, res) => {
  let user = await User.findById(req.user)

  const validPassword = await bcrypt.compare(req.body.currentPassword, user.password)
  if (!validPassword) return res.status(400).send('Invalid password')

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(req.body.newPassword, salt)

  await user.save()

  res.send('Password updated')
})

module.exports = router