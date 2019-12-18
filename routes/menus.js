const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const getAll = require("../middleware/getAll");
const validateInput = require("../middleware/validateInput");
const validateObjectId = require("../middleware/validateObjectId");
const { Menu, validate } = require("../models/menu");
const { Recipe } = require("../models/recipe");

router.post("/", [auth, validateInput(validate)], async (req, res) => {
  const menu = new Menu({
    name: req.body.name,
    recipes: req.body.recipes,
    owner: req.user._id
  });

  await menu.save();

  res.send(menu);
});

router.get("/", [auth], async (req, res) => {
  res.send(await getAll(req, Menu, { owner: req.user._id }));
});

const addRecipe = async recipe => {
  const recipeInDb = await Recipe.findById(recipe._id);
  recipeInDb.price = (recipeInDb.price * recipe.servings) / recipeInDb.servings;
  recipeInDb.servings = recipe.servings;
  return recipeInDb;
};

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).send("No menu with given id exists");
  if (menu.owner != req.user._id)
    return res.status(403).send("Unauthorized: not the owner of the menu");

  const recipes = await Promise.all(menu.recipes.map(addRecipe));

  res.send({ name: menu.name, _id: menu._id, owner: menu.owner, recipes });
});

router.put(
  "/:id",
  [auth, validateObjectId, validateInput(validate)],
  async (req, res) => {
    let menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).send("No menu with given id exists");

    if (menu.owner != req.user._id)
      return res.status(403).send("Unauthorized: not the owner of the menu");

    menu.name = req.body.name;
    menu.recipes = req.body.recipes;
    await menu.save();

    res.send(menu);
  }
);

router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  let menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).send("No menu with given id exists");

  if (menu.owner != req.user._id)
    return res.status(403).send("Unauthorized: not the owner of the menu");

  menu.owner = null;

  await menu.save();

  res.send(menu);
});

module.exports = router;
