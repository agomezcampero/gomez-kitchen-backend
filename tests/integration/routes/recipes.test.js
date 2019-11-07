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
      liderId: '605784',
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
      userId = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.body.data.length).toBe(0)
    })
  })

  describe('PUT /:id', () => {
    let id
    let name
    let ingredients
    let instructions
    let servings
    let prepTime
    let payload

    const exec = () => {
      return request(server)
        .put('/api/recipes/' + id)
        .set('x-auth-token', token)
        .send(payload)
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
            price: 1000
            
          }
        ],
        instructions: ['d', 'e', 'f'],
        servings: 4,
        prepTime: 30,
        price: 100000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
      id = recipe1._id

      name = 'recipe2'
      ingredients = [{
        _id: ingredientId,
        amount: 1,
        unit: 'kg'
      }]
      instructions = ['a','b','c']
      servings = 2
      prepTime = 10
      payload = { name, ingredients, instructions, servings, prepTime }
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

    it('should return 404 if the recipe doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if it is a valid request', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the changes in the db and recalculate the price', async () => {
      await exec()

      const recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.name).toBe('recipe2')
      expect(recipeInDb.price).toBe(1000)
      expect(recipeInDb.instructions).toEqual(
        expect.arrayContaining(['a','b','c']))
      expect(recipeInDb.servings).toBe(2)
      expect(recipeInDb.prepTime).toBe(10)
    })

    it('should return the updated recipe', async () => {
      const res = await exec()

      expect(res.body.name).toBe('recipe2')
      expect(res.body.price).toBe(1000)
      expect(res.body.instructions).toEqual(
        expect.arrayContaining(['a','b','c']))
      expect(res.body.servings).toBe(2)
      expect(res.body.prepTime).toBe(10)
    })

    it('should only update name if only name is sent', async () => {
      payload = { name }

      await exec()

      const recipeInDb = await Recipe.findById(id)
      
      expect(recipeInDb.name).toBe('recipe2')
      expect(recipeInDb.price).toBe(100000)
      expect(recipeInDb.instructions).toEqual(
        expect.arrayContaining(['d','e','f']))
      expect(recipeInDb.servings).toBe(4)
      expect(recipeInDb.prepTime).toBe(30)
    })

  })

  describe('PUT /:id/follow', () => {
    let id
    let newUserId

    const exec = () => {
      return request(server)
        .put(`/api/recipes/${id}/follow`)
        .set('x-auth-token', newUserToken)
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

    it('should return 404 if the recipe doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 400 if the user is already following the recipe', async () => {
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

      const recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.name).toBe('recipe1')
      expect(recipeInDb.followers.length).toBe(2)
      expect(recipeInDb.followers[1].toHexString()).toBe(newUserId.toHexString())
    })
    
    it('should return the recipe with the new follower', async () => {
      const res = await exec()

      expect(res.body.name).toBe('recipe1')
      expect(res.body.followers.length).toBe(2)
      expect(res.body.followers[1]).toBe(newUserId.toHexString())
    })

    it('should be added as owner and follower if there is no owner', async () => {
      const recipe2 = new Recipe ({
        name: 'recipe2',
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
        owner: null,
        followers: []
      })
      await recipe2.save()

      id = recipe2._id

      await exec()

      const recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.owner.toHexString()).toBe(newUserId.toHexString())
      expect(recipeInDb.followers.length).toBe(1)
      expect(recipeInDb.followers[0].toHexString()).toBe(newUserId.toHexString())  
    })

  }) 

  describe('PUT /:id/refresh', () => {
    let id
    let token
    
    const exec = () => {
      return request(server)
        .put(`/api/recipes/${id}/refresh`)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const recipe1 = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            _id: ingredientId,
            amount: 1,
            unit: 'kg',
            name: 'name1',
            price: 1000
            
          }
        ],
        instructions: ['d', 'e', 'f'],
        servings: 4,
        prepTime: 30,
        price: 1000,
        owner: userId,
        followers: [userId]
      })
      await recipe1.save()
      id = recipe1._id
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

    it('should return 404 if the recipe doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if it could find the product and update', async() => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the recipe with the new price in the db', async() => {
      res = await exec()

      const recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.name).toBe('recipe1')
      expect(recipeInDb.price).not.toBe(1000)
    })

    it('should return the recipe with the new price', async() => {
      const res = await exec()

      expect(res.body.name).toBe('recipe1')
      expect(res.body.price).not.toBe(1000)
    })
  })

  describe('DELETE /:id', () => {
    let id
    let recipe

    const exec = () => {
      return request(server)
        .delete(`/api/recipes/${id}`)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      recipe = new Recipe ({
        name: 'recipe1',
        ingredients: [
          {
            _id: ingredientId,
            amount: 1,
            unit: 'kg',
            name: 'name1',
            price: 1000
            
          }
        ],
        instructions: ['d', 'e', 'f'],
        servings: 4,
        prepTime: 30,
        price: 1000,
        owner: userId,
        followers: [userId]
      })
      await recipe.save()
      id = recipe._id
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

    it('should return 404 if the recipe doesnt exist', async () => {
      id = new mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should remove the owner from the recipe as well as the followers if only one follower', async () => {
      await exec()

      recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.name).toBe('recipe1')
      expect(recipeInDb.owner).toBe(null)
      expect(recipeInDb.followers.length).toBe(0)
    })

    it('should return the recipe with no owner or followers if only one follower', async () => {
      const res = await exec()

      expect(res.body.name).toBe('recipe1')
      expect(res.body.owner).toBe(null)
      expect(res.body.followers.length).toBe(0)
    })

    it('should save the recipe with new owner and remove owner as one of the followers if there was more than one follower and request sent by owner', async () => {
      const otherId = new mongoose.Types.ObjectId()
      recipe.followers.push(otherId)
      await recipe.save()

      await exec()

      recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.owner.toHexString()).toBe(otherId.toHexString())
      expect(recipeInDb.followers.length).toBe(1)
      expect(recipeInDb.followers[0].toHexString()).toBe(otherId.toHexString())

    })

    it('should return the recipe with new owner and followers if there was more than one follower and request sent by owner', async () => {
      const otherId = new mongoose.Types.ObjectId()
      recipe.followers.push(otherId)
      await recipe.save()

      const res = await exec()

      expect(res.body.owner).toBe(otherId.toHexString())
      expect(res.body.followers.length).toBe(1)
      expect(res.body.followers[0]).toBe(otherId.toHexString())
    })

    it('should save the recipe removing the user as follower but not changing the owner if request not sent by owner', async () => {
      const user = new User()
      recipe.followers.push(user._id)
      token = user.generateAuthToken()
      await recipe.save()

      await exec()

      recipeInDb = await Recipe.findById(id)

      expect(recipeInDb.owner.toHexString()).toBe(userId.toHexString())
      expect(recipeInDb.followers.length).toBe(1)
      expect(recipeInDb.followers[0].toHexString()).toBe(userId.toHexString())
    })

    it('should return the recipe removing the user as follower but not changing the owner if request not sent by owner', async () => {
      const user = new User()
      recipe.followers.push(user._id)
      token = user.generateAuthToken()
      await recipe.save()

      const res = await exec()

      expect(res.body.owner).toBe(userId.toHexString())
      expect(res.body.followers.length).toBe(1)
      expect(res.body.followers[0]).toBe(userId.toHexString())
    })

  })



})