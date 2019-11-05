const request = require('supertest')
const mongoose = require('mongoose')
const {User} = require('../../../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')
let server

describe('/api/users', () => {

  beforeEach(() => {
    server = require('../../../index')
  })
  afterEach(async () => { 
    await server.close()
    await User.deleteMany({})
  })

  

  describe('POST /', () => {
    let name
    let email
    let password

    beforeEach(() => {
      name = 'name1'
      email = 'test@email.com'
      password = '12345678'
    })

    const exec = () => {
      return request(server)
        .post('/api/users')
        .send({ name, email, password })
    }

    it('should return 400 if name is missing', async () => {
      name = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if email is missing', async () => {
      email = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is missing', async () => {
      password = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if name is less than 3 characters', async () => {
      name = '12'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if email is not a valid email', async () => {
      email = 'notanemail'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is less than 6 characters', async () => {
      password = '12345'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if a user with that email already exists', async () => {
      await exec()

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should save the user in the db if the request is valid', async () => {
      await exec()

      const user = await User.findOne({ email })

      expect(user.name).toBe(name)
    })

    it('should encrypt the password saved to the db', async () => {
      await exec()

      const user = await User.findOne({ email })

      expect(user.password).toBeTruthy()
      expect(user.password).not.toBe(password)
    })

    it('should return the name and email if the request is valid', async () => {
      const res = await exec()

      expect(res.body.name).toBe(name)
      expect(res.body.email).toBe(email)
      expect(res.body).toHaveProperty('_id')
    })

    it('should return a valid jwt', async () => {
      const res = await exec()

      const decoded = await jwt.verify(res.body.token, config.get('jwtPrivateKey'))

      expect(decoded).toHaveProperty('_id')

    })
  })

  describe('GET /other/:id', () => {
    let user 
    let id
    let token

    const exec = () => {
      return request(server)
        .get('/api/users/other/' + id)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () =>{
      user = new User ({
        name: 'name1',
        email: 'email@test.com',
        password: '12345678'
      })
      await user.save()
      id = user._id
      token = new User().generateAuthToken()
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 404 if an invalid id is sent', async () => {
      id = '1'

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 404 if object with given id does not exist', async () => {
      id = mongoose.Types.ObjectId()

      const res = await exec()

      expect(res.status).toBe(404)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the name and id of the user if the request is valid', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name1')
      expect(res.body).toHaveProperty('_id')
    })
  })

  describe('GET /me', () => {
    let user
    let token
    let id

    const exec = () => {
      return request(server)
        .get('/api/users/me')
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () =>{
      user = new User ({
        name: 'name1',
        email: 'email@test.com',
        password: '12345678'
      })
      await user.save()
      id = user._id
      token = user.generateAuthToken()
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 200 if valid request', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should return the id, name, and email of the user', async () => {
      const res = await exec()

      expect(res.body).toHaveProperty('_id')
      expect(res.body.name).toBe('name1')
      expect(res.body.email).toBe('email@test.com')

    })
  })



})