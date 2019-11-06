const request = require('supertest')
const mongoose = require('mongoose')
const { User } = require('../../../models/user')
const { Ingredient } = require('../../../models/ingredient')
let server

describe('/api/ingredients', () => {
  beforeEach(() => {
    server = require('../../../index')
  })
  afterEach(async () => { 
    await server.close()
    await Ingredient.deleteMany({})
    await User.deleteMany({})
  })

  describe('POST /', () => {
    let name
    let price
    let unit
    let amount
    let link

    beforeEach(() => {
      name = 'ingredient1'
      price = 1000
      unit = 'kg'
      amount = 1
    })

    const exec = () => {
      return request(server)
        .post('/api/ingredients')
        .send({ name, price, unit, amount, link })
    }

    it('should return 400 if name is missing', async () => {
      name = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if price is not a number', async () => {
      price = 'abc'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if unit is not enum', async () => {
      unit = 'abcdef'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if amount is not a number', async () => {
      amount = 'abc'

      const res = await exec()

      expect(res.status).toBe(400)
    })

   
  })


})