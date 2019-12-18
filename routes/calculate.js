const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Ingredient } = require("../models/ingredient");
const { objToArray } = require("../utils/objToArray");

router.post("/generateList", [auth], async (req, res) => {
  const { recipes } = req.body;
  let ingredients = {};
  recipes.forEach(function(r) {
    addIngredients(r, ingredients);
  });

  res.send(
    objToArray(ingredients).sort((a, b) => a.name.localeCompare(b.name))
  );
});

const addIngredients = async (recipe, ingHash) => {
  const { servings, originalServings } = recipe;
  await recipe.ingredients.forEach(async function(ing) {
    let { _id, name, primaryUnit, primaryAmount } = ing;
    const amount = (primaryAmount * servings) / originalServings;
    if (!ingHash[_id]) {
      ingHash[_id] = { name, unit: primaryUnit, amount };
    } else {
      ingHash[_id].amount += amount;
    }
  });
};

module.exports = router;
