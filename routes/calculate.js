const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Ingredient } = require("../models/ingredient");
const { objToArray } = require("../utils/objToArray");

router.post("/generateList", [auth], async (req, res) => {
  const { recipes } = req.body;
  let ingredients = {};
  recipes.forEach(function(r) {
    addIngredients(r.ingredients, ingredients);
  });

  res.send(
    objToArray(ingredients).sort((a, b) => a.name.localeCompare(b.name))
  );
});

const addIngredients = async (ingArray, ingHash) => {
  await ingArray.forEach(async function(ing) {
    let { _id, name, primaryUnit, primaryAmount } = ing;
    if (!ingHash[_id]) {
      ingHash[_id] = { name, unit: primaryUnit, amount: primaryAmount };
    } else {
      ingHash[_id].amount += primaryAmount;
    }
  });
};

module.exports = router;
