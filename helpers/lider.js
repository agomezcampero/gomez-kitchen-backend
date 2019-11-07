const rp = require('request-promise')
const cheerio = require('cheerio')


const LIDER_URL = 'https://www.lider.cl/supermercado/product/'

async function getAttributes(liderId){
  const options = {
    url: LIDER_URL + liderId,
    transform: body => cheerio.load(body)
  }

  const $ = await rp(options)

  const price = parseInt($('.price').text().replace('$','').replace('.',''),10)
  const spanDisplayName = $('#span-display-name')
  const name = spanDisplayName.prev().text() + ', ' + spanDisplayName.text()
  const amountAndUnit = spanDisplayName.next().text().split(' ')
  const amount = (amountAndUnit.length === 2) ? parseInt(amountAndUnit[0],10) : null
  const unit = (amountAndUnit.length === 2) ? amountAndUnit[1].toLowerCase() : null

  return {name, price, amount, unit}
}

module.exports.getAttributes = getAttributes