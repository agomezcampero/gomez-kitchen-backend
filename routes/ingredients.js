const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const getAll = require("../middleware/getAll");
const validateInput = require("../middleware/validateInput");
const validateObjectId = require("../middleware/validateObjectId");
const {
  Ingredient,
  validate,
  validateForUpdate,
  validateForLider
} = require("../models/ingredient");
const { getAttributes, search: liderSearch } = require("../helpers/lider");

router.post("/", [auth, validateInput(validate)], async (req, res) => {
  const ingredient = new Ingredient({
    name: req.body.name,
    price: req.body.price,
    unit: req.body.unit,
    amount: req.body.amount,
    extraUnits: req.body.extraUnits,
    liderId: req.body.liderId,
    owner: req.user._id,
    followers: [req.user._id]
  });

  await ingredient.save();

  res.send(ingredient);
});

router.post(
  "/lider",
  [auth, validateInput(validateForLider)],
  async (req, res) => {
    attr = await getAttributes(req.body.liderId);

    if (
      !attr.name ||
      !attr.price ||
      attr.price === 0 ||
      !attr.unit ||
      !attr.amount
    )
      return res
        .status(400)
        .send(
          "Could not create ingredient, check product id is correct or contact developers"
        );

    const ingredient = new Ingredient({
      name: attr.name,
      price: attr.price,
      unit: attr.unit,
      amount: attr.amount,
      liderId: req.body.liderId,
      owner: req.user._id,
      followers: [req.user._id]
    });

    await ingredient.save();

    res.send(ingredient);
  }
);

router.get("/", async (req, res) => {
  res.send(await getAll(req, Ingredient));
});

router.get("/lider", async (req, res) => {
  const ingredients = await liderSearch(req.query.query);
  res.send({ data: ingredients });
});

router.get("/:id", [validateObjectId], async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);
  if (!ingredient)
    return res.status(404).send("No ingredient with given id exists");
  res.send(ingredient);
});

router.get("/following/me", [auth], async (req, res) => {
  res.send(await getAll(req, Ingredient, { followers: req.user._id }));
});

router.get("/following/:id", [validateObjectId], async (req, res) => {
  res.send(await getAll(req, Ingredient, { followers: req.params.id }));
});

router.put(
  "/:id",
  [auth, validateObjectId, validateInput(validateForUpdate)],
  async (req, res) => {
    let ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient)
      return res.status(404).send("No ingredient with given id exists");

    if (ingredient.owner && ingredient.owner != req.user._id)
      return res
        .status(403)
        .send("Unauthorized: not the owner of the ingredient");

    ingredient.name = req.body.name || ingredient.name;
    ingredient.price = req.body.price || ingredient.price;
    ingredient.unit = req.body.unit || ingredient.unit;
    ingredient.amount = req.body.amount || ingredient.amount;
    ingredient.extraUnits = req.body.extraUnits || ingredient.extraUnits;
    ingredient.liderId = req.body.liderId || ingredient.liderId;

    if (!ingredient.owner) {
      ingredient.owner = req.user._id;
      ingredient.followers.push(req.user._id);
    }

    await ingredient.save();

    res.send(ingredient);
  }
);

router.put("/:id/follow", [auth, validateObjectId], async (req, res) => {
  let ingredient = await Ingredient.findById(req.params.id);
  if (!ingredient)
    return res.status(404).send("No ingredient with given id exists");

  if (ingredient.followers.indexOf(req.user._id) != -1)
    return res.status(400).send("User already follows given ingredient");

  ingredient.owner = !ingredient.owner ? req.user._id : ingredient.owner;
  ingredient.followers.push(req.user._id);
  await ingredient.save();

  res.send(ingredient);
});

router.put("/:id/refresh", [auth, validateObjectId], async (req, res) => {
  let ingredient = await Ingredient.findById(req.params.id);
  if (!ingredient)
    return res.status(404).send("No ingredient with given id exists");

  if (!ingredient.liderId)
    return res.status(400).send("Ingredient doesnt have a Lider Id");

  const refresh = await ingredient.refresh();
  if (!refresh)
    return res
      .status(400)
      .send(
        `Lider.cl did not find the product, check that "${ingredient.liderId}" is the correct product id`
      );

  await ingredient.save();

  res.send(ingredient);
});

router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  let ingredient = await Ingredient.findById(req.params.id);
  if (!ingredient)
    return res.status(404).send("No ingredient with given id exists");

  const index = ingredient.followers.indexOf(req.user._id);
  if (index === -1)
    return res.status(400).send("User not following this ingredient");

  if (ingredient.owner._id.toHexString() === req.user._id) {
    ingredient.owner =
      ingredient.followers.length > 1 ? ingredient.followers[1] : null;
  }

  ingredient.followers.splice(index, 1);

  await ingredient.save();

  res.send(ingredient);
});

module.exports = router;
