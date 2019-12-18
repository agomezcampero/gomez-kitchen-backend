const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
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

const addIngredients = (ingArray, ingHash) => {
  ingArray.forEach(function(ing) {
    const { name, unit, amount } = ing;
    if (!ingHash[`${name}|${unit}`]) {
      ingHash[`${name}|${unit}`] = { name, unit, amount };
    } else {
      ingHash[`${name}|${unit}`].amount += amount;
    }
  });
};

module.exports = router;
