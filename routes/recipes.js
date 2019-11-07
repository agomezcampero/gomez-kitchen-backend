const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const getAll = require('../middleware/getAll')
const validateInput = require('../middleware/validateInput')
const validateObjectId = require('../middleware/validateObjectId')
const { Recipe, validate } = require('../models/recipe')
const { Ingredient } = require('../models/ingredient')

const getRecipePrice = (accumulator, currentValue) => accumulator + currentValue.price;

const getIngredientsToSave = async (ing) => {
  const ingInDb = await Ingredient.findById(ing._id)
  if (!ingInDb) return 'Error'

  if(ingInDb.unit != ing.unit) return 'Error'
  
  price = ingInDb.price * ing.amount
  return {
    _id: ing._id,
    name: ingInDb.name,
    price: price,
    unit: ing.unit,
    amount: ing.amount
  }
}

router.post('/', [auth, validateInput(validate)], async (req, res) => {

  const ingredients = await Promise.all(req.body.ingredients.map(getIngredientsToSave))
  if (ingredients.indexOf('Error') != -1) return res.status(400).send('Ingredient doesnt exist or unit doesnt match')
  
  price = ingredients.reduce(getRecipePrice, 0)

  const recipe = new Recipe({
    name: req.body.name,
    price: price,
    ingredients: ingredients,
    instructions: req.body.instructions,
    prepTime: req.body.prepTime,
    servings: req.body.servings,
    owner: req.user._id,
    followers: [req.user._id]
  })

  await recipe.save()  
  
  res.send(recipe)
})

router.get('/', [auth], async (req, res) => {
  res.send(await getAll(req, Recipe))
})

router.get('/:id', [auth, validateObjectId], async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
  if (!recipe) return res.status(404).send('No recipe with given id exists')
  res.send(recipe)
})

router.get('/following/me', [auth], async (req, res) => {
  res.send(await getAll(req, Recipe, { followers: req.user._id }))
})

router.get('/following/:id', [auth, validateObjectId], async (req, res) => {
  res.send(await getAll(req, Recipe, { followers: req.params.id }))
})

module.exports = router