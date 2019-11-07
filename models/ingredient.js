const mongoose = require('mongoose')
const Joi = require('joi')
const { getAttributes } = require('../helpers/lider')

const unitEnum = ['kg', 'g', 'l', 'ml', 'un', 'cc']

const ingredientSchema = new mongoose.Schema({
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
  },
  liderId: {
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

ingredientSchema.methods.refresh = async function() {
  if (!this.liderId) return false

  const attr = await getAttributes(this.liderId)
  const price = attr.price
  if (price === 0 || !price) return false

  this.price = attr.price
  return true
}

const Ingredient = mongoose.model('Ingredient', ingredientSchema)

function validateSchema(ingredient){
  const schema = {
    name: Joi.string().min(3).max(100).required(),
    price: Joi.number().min(0).max(99999999).required(),
    unit: Joi.string().valid(unitEnum),
    amount: Joi.number().min(0).max(99999999).required(),
    liderId: Joi.string().min(1).max(10)
  }
  return Joi.validate(ingredient, schema)
}

function validateSchemaForUpdate(ingredient){
  const schema = {
    name: Joi.string().min(3).max(100),
    price: Joi.number().min(0).max(99999999),
    unit: Joi.string().valid(unitEnum),
    amount: Joi.number().min(0).max(99999999),
    liderId: Joi.string().min(1).max(10)
  }
  return Joi.validate(ingredient, schema)
}

function validateSchemaForLider(ingredient){
  const schema = {
    liderId: Joi.string().min(1).max(10).required()
  }
  return Joi.validate(ingredient, schema)
}

module.exports.Ingredient = Ingredient
module.exports.validate = validateSchema
module.exports.validateForUpdate = validateSchemaForUpdate
module.exports.validateForLider = validateSchemaForLider
module.exports.unitEnum = unitEnum