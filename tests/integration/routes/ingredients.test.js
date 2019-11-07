const request = require('supertest')
const mongoose = require('mongoose')
const { User } = require('../../../models/user')
const { Ingredient } = require('../../../models/ingredient')
let server

describe('/api/ingredients', () => {
  let token
  let userId

  beforeEach(async () => {
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
        .send({ name, price, unit, amount })
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

    it('should return the ingredient', async () => {
      const res = await exec()

      expect(res.body.name).toBe(name)
      expect(res.body.price).toBe(price)
      expect(res.body.unit).toBe(unit)
      expect(res.body.amount).toBe(amount)
      expect(res.body).toHaveProperty('owner')
      expect(res.body).toHaveProperty('followers')
    })

   
  })

  describe('POST /lider', () => {
    let liderId

    beforeEach(() => {
      liderId = '3685'
    })

    const exec = () => {
      return request(server)
        .post('/api/ingredients/lider')
        .set('x-auth-token', token)
        .send({ liderId })
    }

    it('should return 401 if user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 400 if liderId is missing', async () => {
      liderId = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if the liderId is invalid', async () => {
      liderId = 'abce'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the ingredient in the db', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({liderId})

      const ingredients = await Ingredient.find({})

      expect(ingredient).not.toBeNull()
    })

    it('should add id of the creator of the ingredient as owner', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({liderId})

      expect(ingredient.owner.toHexString()).toBe(userId.toHexString())
    })

    it('should add id of the creator of the ingredient as follower', async () => {
      await exec()

      const ingredient = await Ingredient.findOne({liderId})

      expect(ingredient.followers[0].toHexString()).toBe(userId.toHexString())
    })

    it('should return the ingredient', async() => {
      const res = await exec()

      expect(res.body).toHaveProperty('name')
      expect(res.body).toHaveProperty('price')
      expect(res.body).toHaveProperty('unit')
      expect(res.body).toHaveProperty('amount')
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

  describe('GET following/:id', () => {

    const exec = () => {
      return request(server)
        .get('/api/ingredients/following/' + userId)
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
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if the userid is invalid', async() => {
      userId = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the ingredients if the selected user has ingredients', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(1)
    })

    it('should return no ingredients if the selected user doesnt exist or doesnt have ingredients', async () => {
      userId = mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.body.data.length).toBe(0)
    })
  })

  describe('GET following/me', () => {

    const exec = () => {
      return request(server)
        .get('/api/ingredients/following/me')
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

    it('should return the ingredients if the auth user has ingredients', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(1)
    })

    it('should return no ingredients if the auth user doesnt have ingredients', async () => {
      token = new User().generateAuthToken()

      const res = await exec()

      expect(res.body.data.length).toBe(0)
    })
  })

  describe('PUT /:id', () => {
    let id
    let name
    let price
    let unit
    let amount
    let liderId

    const exec = () => {
      return request(server)
        .put('/api/ingredients/' + id)
        .set('x-auth-token', token)
        .send({ name, price, unit, amount, liderId })
    }

    beforeEach(async () => {
      const ingredient = new Ingredient ({
        name: 'name1',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        liderId: '1234',
        followers: [userId]
      })
      await ingredient.save()
      id = ingredient._id

      name = 'name2'
      price = 450
      unit = 'l'
      amount = 2
      liderId = '5678'

    })

    it('should return 401 if the user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 403 if the logged in user is not the owner', async () => {
      token = new User().generateAuthToken()

      const res = await exec()

      expect(res.status).toBe(403)
    })

    it('should return 404 if the id is not valid', async () => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if the ingredient doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 400 if the name is less than 3 characters', async () => {
      name = '12'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if the price is not a number', async () => {
      price = 'abc'
      
      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if the unit is not a enum', async () => {
      unit = 'abc'
      
      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if the amount is not a number', async () => {
      amount = 'abc'
      
      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if it is a valid request', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the changes in the db', async () => {
      await exec()

      const ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.name).toBe('name2')
      expect(ingredientInDb.price).toBe(450)
      expect(ingredientInDb.unit).toBe('l')
      expect(ingredientInDb.amount).toBe(2)
      expect(ingredientInDb.liderId).toBe('5678')
    })
    
    it('should return the update ingredient', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name2')
      expect(res.body.price).toBe(450)
      expect(res.body.unit).toBe('l')
      expect(res.body.amount).toBe(2)
      expect(res.body.liderId).toBe('5678')
    })
  })

  describe('PUT /:id/follow', () => {
    let id
    let newUserId

    const exec = () => {
      return request(server)
        .put(`/api/ingredients/${id}/follow`)
        .set('x-auth-token', newUserToken)
        .send()
    }

    beforeEach(async () => {
      const ingredient = new Ingredient({
        name: 'name1',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        followers: [userId]
      })
      await ingredient.save()
      id = ingredient._id

      const newUser = new User({
        name: 'new user',
        email: 'newuser@test.com',
        password: '12345678'
      })
      newUserId = newUser._id
      newUserToken = newUser.generateAuthToken()
    })

    it('should return 401 if the user is not logged in', async () => {
      newUserToken = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if the id is not valid', async () => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if the ingredient doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 400 if the user is already following the ingredient', async () => {
      newUserToken = token

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if it is a valid request', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should add the follower in the db', async () => {
      await exec()

      const ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.name).toBe('name1')
      expect(ingredientInDb.followers.length).toBe(2)
      expect(ingredientInDb.followers[1].toHexString()).toBe(newUserId.toHexString())
    })
    
    it('should return the ingredient with the new follower', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name1')
      expect(res.body.followers.length).toBe(2)
      expect(res.body.followers[1]).toBe(newUserId.toHexString())
    })

    it('should be added as owner and follower if there is no owner', async () => {
      const ingredient2 = new Ingredient({
        name: 'name2',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: null,
        followers: []
      })
      await ingredient2.save()

      id = ingredient2._id

      await exec()

      const ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.owner.toHexString()).toBe(newUserId.toHexString())
      expect(ingredientInDb.followers.length).toBe(1)
      expect(ingredientInDb.followers[0].toHexString()).toBe(newUserId.toHexString())  
    })

  })

  describe('PUT /:id/refresh', () => {
    let id
    let token

    const exec = () => {
      return request(server)
        .put(`/api/ingredients/${id}/refresh`)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const ingredient = new Ingredient({
        name: 'name1',
        price: 100,
        unit: 'kg',
        amount: 1,
        owner: userId,
        liderId: '605784',
        followers: [userId]
      })
      await ingredient.save()
      id = ingredient._id

      token = new User().generateAuthToken()
    })

    it('should return 401 if the user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if the id is not valid', async () => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if the ingredient doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 400 if it couldnt find the product in lider', async () => {
      const ingredient2 = new Ingredient({
        name: 'name2',
        price: 990,
        unit: 'kg',
        amount: 1,
        owner: userId,
        liderId: 'abcd',
        followers: [userId]
      })
      await ingredient2.save()
      id = ingredient2._id

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if it could find the product and update', async() => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the ingredient with the new price in the db', async() => {
      res = await exec()

      const ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.name).toBe('name1')
      expect(ingredientInDb.price).not.toBe(100)
    })

    it('should return the ingredient with the new price', async() => {
      const res = await exec()

      expect(res.body.name).toBe('name1')
      expect(res.body.price).not.toBe(100)
    })

  })

  describe('DELETE /:id', () => {
    let id
    let ingredient

    const exec = () => {
      return request(server)
        .delete('/api/ingredients/' + id)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      ingredient = new Ingredient ({
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

    it('should return 401 if the user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if the id is not valid', async () => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if the ingredient doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should remove the owner from the ingredient as well as the followers if only one follower', async () => {
      await exec()

      ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.name).toBe('name1')
      expect(ingredientInDb.owner).toBe(null)
      expect(ingredientInDb.followers.length).toBe(0)
    })

    it('should return the ingredient with no owner or followers if only one follower', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name1')
      expect(res.body.owner).toBe(null)
      expect(res.body.followers.length).toBe(0)
    })

    it('should save the ingredient with new owner and remove owner as one of the followers if there was more than one follower and request sent by owner', async () => {
      const otherId = new mongoose.Types.ObjectId()
      ingredient.followers.push(otherId)
      await ingredient.save()

      await exec()

      ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.owner.toHexString()).toBe(otherId.toHexString())
      expect(ingredientInDb.followers.length).toBe(1)
      expect(ingredientInDb.followers[0].toHexString()).toBe(otherId.toHexString())

    })

    it('should return the ingredient with new owner and followers if there was more than one follower and request sent by owner', async () => {
      const otherId = new mongoose.Types.ObjectId()
      ingredient.followers.push(otherId)
      await ingredient.save()

      const res = await exec()

      expect(res.body.owner).toBe(otherId.toHexString())
      expect(res.body.followers.length).toBe(1)
      expect(res.body.followers[0]).toBe(otherId.toHexString())
    })

    it('should save the ingredient removing the user as follower but not changing the owner if request not sent by owner', async () => {
      const user = new User()
      ingredient.followers.push(user._id)
      token = user.generateAuthToken()
      await ingredient.save()

      await exec()

      ingredientInDb = await Ingredient.findById(id)

      expect(ingredientInDb.owner.toHexString()).toBe(userId.toHexString())
      expect(ingredientInDb.followers.length).toBe(1)
      expect(ingredientInDb.followers[0].toHexString()).toBe(userId.toHexString())
    })

    it('should return the ingredient removing the user as follower but not changing the owner if request not sent by owner', async () => {
      const user = new User()
      ingredient.followers.push(user._id)
      token = user.generateAuthToken()
      await ingredient.save()

      const res = await exec()

      expect(res.body.owner).toBe(userId.toHexString())
      expect(res.body.followers.length).toBe(1)
      expect(res.body.followers[0]).toBe(userId.toHexString())
    })


  })


})