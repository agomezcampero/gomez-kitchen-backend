const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const getAll = require("../middleware/getAll");
const validateInput = require("../middleware/validateInput");
const validateObjectId = require("../middleware/validateObjectId");
const { Recipe, validate, validateForUpdate } = require("../models/recipe");
const { Ingredient } = require("../models/ingredient");
const { getAttributes } = require("../helpers/lider");

const getRecipePrice = (accumulator, currentValue) =>
  accumulator + currentValue.price;

const getIngredientsToSave = async ing => {
  const ingInDb = await Ingredient.findById(ing._id);
  if (!ingInDb) return "Error";

  let amountInDb = ingInDb.amount;
  let extraUnits = [ingInDb.unit].concat(
    ingInDb.extraUnits.map(function(eu) {
      return eu["unit"];
    })
  );
  let primaryAmount = ing.amount;
  if (ingInDb.unit !== ing.unit) {
    extraUnit = ingInDb.extraUnits.find(el => el.unit === ing.unit);
    if (!extraUnit) return "Error";

    amountInDb = extraUnit.amount;
    primaryAmount = (ing.amount * ingInDb.amount) / extraUnit.amount;
  }

  price = Math.round((ingInDb.price * ing.amount) / amountInDb);
  return {
    _id: ing._id,
    name: ingInDb.name,
    price: price,
    unit: ing.unit,
    amount: ing.amount,
    extraUnits,
    primaryUnit: ingInDb.unit,
    primaryAmount
  };
};

const updateIngredients = async ing => {
  let ingInDb = await Ingredient.findById(ing._id);
  await ingInDb.refresh();
  await ingInDb.save();
  let amountInDb = ingInDb.amount;
  let extraUnits = [ingInDb.unit].concat(
    ingInDb.extraUnits.map(function(eu) {
      return eu["unit"];
    })
  );
  let primaryAmount = ing.amount;
  if (ingInDb.unit !== ing.unit) {
    extraUnit = ingInDb.extraUnits.find(el => el.unit === ing.unit);
    amountInDb = extraUnit.amount;
    primaryAmount = (ing.amount * ingInDb.amount) / extraUnit.amount;
  }
  return {
    _id: ing._id,
    name: ingInDb.name,
    price: Math.round((ingInDb.price * ing.amount) / amountInDb),
    unit: ing.unit,
    amount: ing.amount,
    extraUnits,
    primaryUnit: ingInDb.unit,
    primaryAmount
  };
};

router.post("/", [auth, validateInput(validate)], async (req, res) => {
  const ingredients = await Promise.all(
    req.body.ingredients.map(getIngredientsToSave)
  );
  if (ingredients.indexOf("Error") != -1)
    return res.status(400).send("Ingredient doesnt exist or unit doesnt match");

  price = ingredients.reduce(getRecipePrice, 0);

  const recipe = new Recipe({
    name: req.body.name,
    price: price,
    ingredients: ingredients,
    instructions: req.body.instructions,
    prepTime: req.body.prepTime,
    servings: req.body.servings,
    owner: req.user._id,
    followers: [req.user._id]
  });

  await recipe.save();

  res.send(recipe);
});

router.get("/", [auth], async (req, res) => {
  res.send(await getAll(req, Recipe));
});

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).send("No recipe with given id exists");
  res.send(recipe);
});

router.get("/following/me", [auth], async (req, res) => {
  res.send(await getAll(req, Recipe, { followers: req.user._id }));
});

router.get("/following/:id", [auth, validateObjectId], async (req, res) => {
  res.send(await getAll(req, Recipe, { followers: req.params.id }));
});

router.put(
  "/:id",
  [auth, validateObjectId, validateInput(validateForUpdate)],
  async (req, res) => {
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send("No recipe with given id exists");

    if (recipe.owner != req.user._id)
      return res.status(403).send("Unauthorized: not the owner of the recipe");

    recipe.name = req.body.name || recipe.name;

    if (req.body.ingredients) {
      ingredients = await Promise.all(
        req.body.ingredients.map(getIngredientsToSave)
      );
      if (ingredients.indexOf("Error") != -1)
        return res
          .status(400)
          .send("Ingredient doesnt exist or unit doesnt match");

      recipe.ingredients = ingredients;
      recipe.price = ingredients.reduce(getRecipePrice, 0);
    }

    recipe.instructions = req.body.instructions || recipe.instructions;
    recipe.prepTime = req.body.prepTime || recipe.prepTime;
    recipe.servings = req.body.servings || recipe.servings;

    await recipe.save();

    res.send(recipe);
  }
);

router.put("/:id/follow", [auth, validateObjectId], async (req, res) => {
  let recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).send("No recipe with given id exists");

  if (recipe.followers.indexOf(req.user._id) != -1)
    return res.status(400).send("User already follows given recipe");

  recipe.owner = !recipe.owner ? req.user._id : recipe.owner;
  recipe.followers.push(req.user._id);
  await recipe.save();

  res.send(recipe);
});

router.put("/:id/refresh", [auth, validateObjectId], async (req, res) => {
  let recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).send("No recipe with given id exists");

  const ingredients = await Promise.all(
    recipe.ingredients.map(updateIngredients)
  );
  price = ingredients.reduce(getRecipePrice, 0);

  recipe.ingredients = ingredients;
  recipe.price = price;

  await recipe.save();

  res.send(recipe);
});

router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  let recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).send("No recipe with given id exists");

  const index = recipe.followers.indexOf(req.user._id);
  if (index === -1)
    return res.status(400).send("User not following this recipe");

  if (recipe.owner._id.toHexString() === req.user._id) {
    recipe.owner = recipe.followers.length > 1 ? recipe.followers[1] : null;
  }

  recipe.followers.splice(index, 1);

  await recipe.save();

  res.send(recipe);
});

module.exports = router;
