const mongoose = require('mongoose')
const Joi = require('joi')
const { unitEnum } = require('./ingredient')

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 50,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 99999999
  },
  ingredients: [{
    type: new mongoose.Schema({
      name: {
        type: String,
        minlength: 3,
        maxlength: 100,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0,
        max: 99999999
      },
      unit: {
        type: String,
        required: true,
        enum: unitEnum,
        default: 'un'
      },
      amount: {
        type: Number,
        min: 0,
        max: 99999999,
        default: 1
      }
    }),
    required: true
  }],
  instructions: [{
    type: String
  }],
  prepTime: {
    type: Number
  },
  servings: {
    type: Number,
    default: 2
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

const Recipe = mongoose.model('Recipe', recipeSchema)

function validateSchema(recipe){
  const ingredientSchema = {
    _id: Joi.objectId().required(),
    unit: Joi.string().valid(unitEnum).required(),
    amount: Joi.number().min(0).max(99999999).required()
  }
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    ingredients: Joi.array().items(ingredientSchema).required(),
    instructions: Joi.array().items(Joi.string().min(1).max(10000)).min(1).required(),
    prepTime: Joi.number().min(0).max(99999999),
    servings: Joi.number().min(0).max(99999999)
  }
  return Joi.validate(recipe, schema)
}

function validateSchemaForUpdate(recipe){
  const ingredientSchema = {
    _id: Joi.objectId().required(),
    unit: Joi.string().valid(unitEnum).required(),
    amount: Joi.number().min(0).max(99999999).required()
  }
  const schema = {
    name: Joi.string().min(3).max(50),
    ingredients: Joi.array().items(ingredientSchema),
    instructions: Joi.array().items(Joi.string().min(1).max(10000)).min(1),
    prepTime: Joi.number().min(0).max(99999999),
    servings: Joi.number().min(0).max(99999999)
  }
  return Joi.validate(recipe, schema)
}

module.exports.Recipe = Recipe
module.exports.validate = validateSchema
module.exports.validateForUpdate = validateSchemaForUpdate