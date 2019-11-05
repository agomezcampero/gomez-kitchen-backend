const mongoose = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 50,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    minlength: 3,
    maxlength: 255
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024
  },
  isAdmin: Boolean
})

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'))
  return token
}

const User = mongoose.model('User', userSchema)

function validateSchema(user){
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(6).max(50).required()
  }
  return Joi.validate(user, schema)
}

module.exports.User = User
module.exports.validate = validateSchema