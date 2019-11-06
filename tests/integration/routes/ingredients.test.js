const request = require('supertest')
const mongoose = require('mongoose')
const { User } = require('../../../models/user')
const { Ingredient } = require('../../../models/ingredient')
let server

describe('/api/ingredients', () => {
  let token
  let userId

  beforeEach( async() => {
    server = require('../../../index')
    const user = new User({
      name: 'name1',
      email: 'test@email.com',
      password: '12345678'
    })
    token = user.generateAuthToken()
    userId = user._id
    await user.save()
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
        .set('x-auth-token', token)
        .send({ name, price, unit, amount, link })
    }

    it('should return 401 if user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

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

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the ingredient in the db', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({name})

      expect(ingredient).not.toBeNull()
    })

    it('should add id of the creator of the ingredient as owner', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({name})

      expect(ingredient.owner.toHexString()).toBe(userId.toHexString())
    })

    it('should add id of the creator of the ingredient as follower', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({name})

      expect(ingredient.followers[0].toHexString()).toBe(userId.toHexString())
    })

    it('should return the ingredient', async() => {
      const res = await exec()

      expect(res.body.name).toBe(name)
      expect(res.body.price).toBe(price)
      expect(res.body.unit).toBe(unit)
      expect(res.body.amount).toBe(amount)
      expect(res.body).toHaveProperty('owner')
      expect(res.body).toHaveProperty('followers')
    })

   
  })

  describe('GET /', () => {
    const exec = () => {
      return request(server)
        .get('/api/ingredients')
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const ingredient = new Ingredient ({
        name: 'name1',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        followers: [userId]
      })
      await ingredient.save()
      const ingredient2 = new Ingredient ({
        name: 'name2',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        followers: [userId]
      })
      await ingredient2.save()
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the ingredients in the data section', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(2)
      expect(res.body.data.some(i => i.name === 'name1')).toBeTruthy()
      expect(res.body.data.some(i => i.name === 'name2')).toBeTruthy()
    })

    it('should return the pagination information', async () => {
      const res = await exec()

      expect(res.body.pagination.totalItems).toBe(2)
      expect(res.body.pagination.page).toBe(1)
      expect(res.body.pagination.totalPages).toBe(1)
      expect(res.body.pagination.items).toBe(2)
    })
  })

  describe('GET /:id', () => {
    let id

    const exec = () => {
      return request(server)
        .get('/api/ingredients/' + id)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const ingredient = new Ingredient ({
        name: 'name1',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        followers: [userId]
      })
      await ingredient.save()
      id = ingredient._id
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if the id is invalid', async() => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if the ingredient doesnt exist', async () => {
      id = mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the ingredient if the request is valid', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name1')
    })
  })


})