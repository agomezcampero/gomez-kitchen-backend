const request = require('supertest')
const mongoose = require('mongoose')
const { User } = require('../../../models/user')
const { Ingredient } = require('../../../models/ingredient')
const { Recipe } = require('../../../models/recipe')
let server

describe('/api/ingredients', () => {
  let token
  let userId
  let ingredientId

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
    const ingredient = new Ingredient ({
      name: 'name1',
      price: 1000,
      unit: 'kg',
      amount: 1,
      owner: userId,
      followers: [userId]
    })
    ingredientId = ingredient._id
    await ingredient.save()
  })

  afterEach(async () => { 
    await server.close()
    await Ingredient.deleteMany({})
    await User.deleteMany({})
    await Recipe.deleteMany({})
  })

  describe('POST /', () => {
    let name
    let ingredients
    let instructions

    beforeEach(() => {
      name = 'recipe 1'
      ingredients = [{ _id: ingredientId, unit: 'kg', amount: 3 }]
      instructions = ['instruction 1', 'instruction 2']
    })

    const exec = () => {
      return request(server)
        .post('/api/recipes')
        .set('x-auth-token', token)
        .send({ name, ingredients, instructions })
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

    it('should return 400 if ingredients doesnt have id', async () => {
      ingredients = [{ unit: 'kg', amount: 1 }]

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if ingredient doesnt exist', async () => {
      ingredients = [{ _id: new mongoose.Types.ObjectId(), unit: 'kg', amount: 1 }]

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if ingredients doesnt have unit', async () => {
      ingredients = [{ _id: ingredientId, amount: 1 }]

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if ingredients doesnt have amount', async () => {
      ingredients = [{ _id: ingredientId, unit: 'kg' }]

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if ingredients unit doesnt match saved ingredient unit', async () => {
      ingredients = [{ _id: ingredientId, unit: 'un', amount: 1 }]

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if instructions is empty', async () => {
      instructions = []

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()
      
      expect(res.status).toBe(200)
    })

    it('should save the recipe in the db', async () => {
      await exec()

      const recipe = await Recipe.findOne({name})

      expect(recipe).not.toBeNull()
    })

    it('should calculate the price and store it', async () => {
      await exec()

      const recipe = await Recipe.findOne({name})

      expect(recipe.price).toBe(3000)
    })

    it('should add id of the creator of the recipe as owner', async () => {
      await exec()

      const recipe = await Recipe.findOne({name})

      expect(recipe.owner.toHexString()).toBe(userId.toHexString())
    })

    it('should add id of the creator of the recipe as follower', async () => {
      await exec()

      const recipe = await Recipe.findOne({name})

      expect(recipe.followers[0].toHexString()).toBe(userId.toHexString())
    })

    it('should return the recipe', async () => {
      const res = await exec()

      expect(res.body.name).toBe(name)
      expect(res.body.price).toBe(3000)
      expect(res.body).toHaveProperty('ingredients')
      expect(res.body).toHaveProperty('instructions')
      expect(res.body).toHaveProperty('owner')
      expect(res.body).toHaveProperty('followers')
    })

  })

  describe('GET /', () => {
    const exec = () => {
      return request(server)
        .get('/api/recipes')
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const recipe1 = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            '_id': ingredientId,
            'name': 'name1',
            'amount': 100,
            'unit': 'kg',
            'price': 100000
          }
        ],
        instructions: ['l', '2', '3'],
        servings: 4,
        prepTime: 30,
        price: 100000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
      const recipe2 = new Recipe ({
        name: 'recipe2',
        ingredients: [
          {
            '_id': ingredientId,
            'name': 'name1',
            'amount': 1,
            'unit': 'kg',
            'price': 1000
          }
        ],
        instructions: ['l', '2', '3'],
        servings: 2,
        prepTime: 10,
        price: 1000,
        owner: userId,
        followers: [userId]
      })
      await recipe2.save()
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

    it('should return the recipes in the data section', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(2)
      expect(res.body.data.some(i => i.name === 'recipe1')).toBeTruthy()
      expect(res.body.data.some(i => i.name === 'recipe2')).toBeTruthy()
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
        .get('/api/recipes/' + id)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const recipe1 = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            _id: ingredientId,
            amount: 100,
            unit: 'kg',
            name: 'name1',
            price: 100000
            
          }
        ],
        instructions: ["l", "2", "3"],
        servings: 4,
        prepTime: 30,
        price: 100000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
      id = recipe1._id
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

    it('should return 404 if the recipe doesnt exist', async () => {
      id = mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the recipe if the request is valid', async () => {
      const res = await exec()

      expect(res.body.name).toBe('recipe1')
    })
  })

  describe('GET /following/me', () => {
    const exec = () => {
      return request(server)
        .get('/api/recipes/following/me')
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const recipe1 = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            _id: ingredientId,
            amount: 100,
            unit: 'kg',
            name: 'name1',
            price: 100000
            
          }
        ],
        instructions: ["l", "2", "3"],
        servings: 4,
        prepTime: 30,
        price: 100000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
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

    it('should return the recipe if the auth user has recipe', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(1)
    })

    it('should return no recipe if the auth user doesnt have recipe', async () => {
      token = new User().generateAuthToken()

      const res = await exec()

      expect(res.body.data.length).toBe(0)
    })
  })

  describe('GET /following/:id', () => {
    const exec = () => {
      return request(server)
        .get('/api/recipes/following/' + userId)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const recipe1 = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            _id: ingredientId,
            amount: 100,
            unit: 'kg',
            name: 'name1',
            price: 100000
            
          }
        ],
        instructions: ["l", "2", "3"],
        servings: 4,
        prepTime: 30,
        price: 100000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
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

    it('should return the recipe if the selected user has recipes', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(1)
    })

    it('should return no recipe if the selected user doesnt have recipes', async () => {
      userId = new User().generateAuthToken()

      const res = await exec()

      expect(res.body.data.length).toBe(0)
    })
  })



})