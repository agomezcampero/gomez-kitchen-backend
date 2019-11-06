const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const auth = require('../middleware/auth')
const getAll = require('../middleware/getAll')
const validateInput = require('../middleware/validateInput')
const validateObjectId = require('../middleware/validateObjectId')
const {Ingredient, validate} = require('../models/ingredient')

router.post('/', [auth, validateInput(validate)], async (req, res) => {

  const ingredient = new Ingredient({
    name: req.body.name,
    price: req.body.price,
    unit: req.body.unit,
    amount: req.body.amount,
    owner: req.user._id,
    followers: [req.user._id]
  })

  ingredient.save()

  res.send(ingredient)
})

router.get('/', [auth], async (req, res) => {
  res.send(await getAll(req, Ingredient))
})

router.get('/:id', [auth, validateObjectId], async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id)
  if (!ingredient) return res.status(404).send('No ingredient with given id exists')
  res.send(ingredient)
})

router.get('/following/me', [auth], async (req, res) => {
  res.send(await getAll(req, Ingredient, { followers: req.user._id }))
})

router.get('/following/:id', [auth, validateObjectId], async (req, res) => {
  res.send(await getAll(req, Ingredient, { followers: req.params.id }))
})

module.exports = router