const mongoose = require("mongoose");
const Joi = require("joi");

const menuSchema = new mongoose.Schema({
  name: String,
  recipes: [
    {
      type: new mongoose.Schema({
        servings: Number
      }),
      required: true
    }
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const Menu = mongoose.model("Menu", menuSchema);

function validateSchema(menu) {
  const schema = {
    name: Joi.string(),
    recipes: Joi.array()
  };

  return Joi.validate(menu, schema);
}

module.exports.Menu = Menu;
module.exports.validate = validateSchema;
