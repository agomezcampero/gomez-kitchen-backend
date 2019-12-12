const mongoose = require("mongoose");
const Joi = require("joi");
const { getAttributes } = require("../helpers/lider");

const unitSchema = {
  type: String,
  required: true,
  default: "un"
};

const amountSchema = {};

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
  unit: unitSchema,
  amount: amountSchema,
  extraUnits: [
    {
      unit: unitSchema,
      amount: amountSchema
    }
  ],
  liderId: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

ingredientSchema.methods.refresh = async function() {
  if (!this.liderId) return false;

  const attr = await getAttributes(this.liderId);
  const price = attr.price;
  if (price === 0 || !price) return false;

  this.price = attr.price;
  this.unit = attr.unit;
  this.amount = attr.amount;
  return true;
};

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

function validateSchema(ingredient) {
  const extraUnitsSchema = {
    unit: Joi.string().required(),
    amount: Joi.number()
      .min(0)
      .max(99999999)
      .required()
  };

  const schema = {
    name: Joi.string()
      .min(3)
      .max(100)
      .required(),
    price: Joi.number()
      .min(0)
      .max(99999999)
      .required(),
    unit: Joi.string(),
    amount: Joi.number()
      .min(0)
      .max(99999999)
      .required(),
    extraUnits: Joi.array().items(extraUnitsSchema),
    liderId: Joi.string()
      .min(0)
      .max(10)
      .allow("")
  };
  return Joi.validate(ingredient, schema);
}

function validateSchemaForUpdate(ingredient) {
  const extraUnitsSchema = {
    unit: Joi.string().required(),
    amount: Joi.number()
      .min(0)
      .max(99999999)
      .required()
  };

  const schema = {
    name: Joi.string()
      .min(3)
      .max(100),
    price: Joi.number()
      .min(0)
      .max(99999999),
    unit: Joi.string(),
    amount: Joi.number()
      .min(0)
      .max(99999999),
    extraUnits: Joi.array().items(extraUnitsSchema),
    liderId: Joi.string().allow("")
  };
  return Joi.validate(ingredient, schema);
}

function validateSchemaForLider(ingredient) {
  const schema = {
    liderId: Joi.string()
      .min(1)
      .max(10)
      .required()
  };
  return Joi.validate(ingredient, schema);
}

module.exports.Ingredient = Ingredient;
module.exports.validate = validateSchema;
module.exports.validateForUpdate = validateSchemaForUpdate;
module.exports.validateForLider = validateSchemaForLider;
