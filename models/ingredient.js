const mongoose = require('mongoose')
const Joi = require('joi')

const unitEnum = ['kg', 'g', 'l', 'ml', 'un']

const ingredientSchema = new mongoose.Schema({
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
  },
  link: {
    type: String
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

const Ingredient = mongoose.model('Ingredient', ingredientSchema)

function validateSchema(ingredient){
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    price: Joi.number().min(0).max(99999999).required(),
    unit: Joi.string().valid(unitEnum),
    amount: Joi.number().min(0).max(99999999).required(),
    link: Joi.string().min(10).max(1000)
  }
  return Joi.validate(ingredient, schema)
}

module.exports.Ingredient = Ingredient
module.exports.validate = validateSchema