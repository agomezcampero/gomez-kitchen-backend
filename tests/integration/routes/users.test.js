const request = require('supertest')
const mongoose = require('mongoose')
const {User} = require('../../../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcrypt')
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

  describe('GET /', () => {
    let token
    let params

    const exec = () => {
      return request(server)
        .get('/api/users' + params)
        .set('x-auth-token', token)
        .send()
    }

    beforeEach(async () => {
      const user = new User ({
        name: 'name1',
        email: 'email@test.com',
        password: '12345678'
      })
      await user.save()
      const user2 = new User ({
        name: 'name2',
        email: 'email2@test.com',
        password: '12345678'
      })
      await user2.save()
      const user3= new User ({
        name: 'name3',
        email: 'email3@test.com',
        password: '12345678'
      })
      await user3.save()
      token = new User().generateAuthToken()
      params = ''
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

    it('should return the users in the data section', async () => {
      const res = await exec()

      expect(res.body.data.length).toBe(3)
      expect(res.body.data.some(u => u.name === 'name1')).toBeTruthy()
      expect(res.body.data.some(u => u.name === 'name2')).toBeTruthy()
      expect(res.body.data.some(u => u.name === 'name3')).toBeTruthy()
    })

    it('should return the pagination information', async () => {
      params = '?itemsPerPage=1&page=2'

      const res = await exec()

      expect(res.body.pagination.totalItems).toBe(3)
      expect(res.body.pagination.page).toBe(2)
      expect(res.body.pagination.totalPages).toBe(3)
      expect(res.body.pagination.items).toBe(1)
    })
  })

  describe('GET /me', () => {
    let user
    let token

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

  describe('GET /:id', () => {
    let user 
    let id
    let token

    const exec = () => {
      return request(server)
        .get('/api/users/' + id)
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

  describe('PUT /me', () => {
    let user
    let token
    let name
    let email
    let payload

    const exec = () => {
      return request(server)
        .put('/api/users/me')
        .set('x-auth-token', token)
        .send(payload)
    }

    beforeEach(async () =>{
      user = new User ({
        name: 'name1',
        email: 'email1@test.com',
        password: '12345678'
      })
      await user.save()
      token = user.generateAuthToken()
      name = 'name2'
      email = 'email2@test.com'
      payload = {name, email}
    })

    it('should return 401 if user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 400 if name has less than 3 characters', async () => {
      name = '12'
      payload = { name, email }

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if email is invalid', async () => {
      email = '12345'
      payload = { name, email }

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should only update email if only valid email is sent', async () => {
      payload = { email }
      await exec()

      user = await User.findOne({ email: 'email2@test.com' })

      expect(user).not.toBeNull()
      expect(user.name).toBe('name1')
    })

    it('should only update name if only valid name is sent', async () => {
      payload = { name }
      await exec()

      user = await User.findOne({ email: 'email1@test.com' })

      expect(user).not.toBeNull()
      expect(user.name).toBe('name2')
    })

    it('should update name and email if both are valid', async () => {
      await exec()

      user = await User.findOne({ email: 'email2@test.com' })

      expect(user).not.toBeNull()
      expect(user.name).toBe('name2')
    })

    it('should return the user with update name and email if valid', async () => {
      const res = await exec()

      expect(res.body.name).toBe('name2')
      expect(res.body.email).toBe('email2@test.com')
    })

  })

  describe('PUT /me/password', () => {
    let user
    let token
    let currentPassword
    let newPassword

    const exec = () => {
      return request(server)
        .put('/api/users/me/password')
        .set('x-auth-token', token)
        .send({currentPassword, newPassword})
    }

    beforeEach(async () =>{
      currentPassword = '12345678'
      newPassword = 'abcdefghi'
      const salt = await bcrypt.genSalt(10)
      hashedPassword = await bcrypt.hash(currentPassword, salt)
      user = new User ({
        name: 'name1',
        email: 'email1@test.com',
        password: hashedPassword
      })
      await user.save()
      token = user.generateAuthToken()
    })

    it('should return 401 if user is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 400 if current password is not sent', async () => {
      currentPassword = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if new password is not sent', async () => {
      newPassword = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if new password is less than 6 characters', async () => {
      newPassword = '123'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if the current password sent is not valid', async () => {
      currentPassword = '87654321'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      expect(res.status).toBe(200)
    })

    it('should update the password if the request is valid', async () => {
      res = await exec()

      const userInDb = await User.findById(user._id)
      const validPassword = await bcrypt.compare(newPassword, userInDb.password)

      expect(validPassword).toBeTruthy()
    })


  })




})