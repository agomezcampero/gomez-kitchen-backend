const rp = require("request-promise");
const cheerio = require("cheerio");

const LIDER_URL = "https://www.lider.cl/supermercado";

async function getAttributes(liderId) {
  const options = {
    url: LIDER_URL + "/product/" + liderId,
    transform: body => cheerio.load(body)
  };

  const $ = await rp(options);

  const price = parseInt(
    $(".price")
      .text()
      .replace("$", "")
      .replace(".", ""),
    10
  );
  const spanDisplayName = $("#span-display-name");
  const name = spanDisplayName.prev().text() + ", " + spanDisplayName.text();
  const amountAndUnit = spanDisplayName
    .next()
    .text()
    .split(" ");
  const amount =
    amountAndUnit.length === 2
      ? parseInt(amountAndUnit[0].replace(",", "."), 10)
      : null;
  const unit =
    amountAndUnit.length === 2 ? amountAndUnit[1].toLowerCase() : null;

  return { name, price, amount, unit };
}

async function search(query) {
  const options = {
    url: `${LIDER_URL}/search?Ntt=${query}&ost=${query}`,
    transform: body => cheerio.load(body)
  };

  const $ = await rp(options);

  let ingredients = [];
  let nextId = $(".box-product");
  let names = $(".product-name");
  let descriptions = $(".product-description");
  let prices = $(".price-sell");
  let attributes = $(".product-attribute");
  let cont = 0;
  while (nextId.attr() && cont < 40) {
    try {
      let ingredient = {};
      ingredient.liderId = nextId.attr("prod-number");
      ingredient.name =
        names[cont].children[0].data +
        ", " +
        descriptions[cont].children[0].data;

      ingredient.price = parseInt(
        prices[cont].children[0].children[0].data
          .replace("$", "")
          .replace(".", ""),
        10
      );
      const amountAndUnit = attributes[cont].children[0].data.split(" ");
      ingredient.amount =
        amountAndUnit.length === 2
          ? parseInt(amountAndUnit[0].replace(",", "."), 10)
          : null;
      ingredient.unit =
        amountAndUnit.length === 2 ? amountAndUnit[1].toLowerCase() : null;

      ingredients.push(ingredient);
    } catch (ex) {}
    nextId = nextId.next();
    cont += 1;
  }
  return ingredients;
}

module.exports.getAttributes = getAttributes;
module.exports.search = search;
