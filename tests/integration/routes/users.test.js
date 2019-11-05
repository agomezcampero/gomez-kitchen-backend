const request = require('supertest')
const mongoose = require('mongoose')
const {User} = require('../../../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')
let server

describe('/api/users', () => {
  let name
  let email
  let password


  beforeEach(() => {
    server = require('../../../index')
    name = 'name'
    email = 'test@email.com'
    password = '12345678'
  })
  afterEach(async () => { 
    await server.close()
    await User.deleteMany({})
  })

  const exec = () => {
    return request(server)
      .post('/api/users')
      .send({ name, email, password })
  }

  describe('POST /', () => {
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

      console.log(res.body)

      expect(res.status).toBe(400)
    })

    it('should return 200 if the request is valid', async () => {
      const res = await exec()

      console.log(res.body)

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
    })

    it('should return a valid jwt', async () => {
      const res = await exec()

      const decoded = await jwt.verify(res.body.token, config.get('jwtPrivateKey'))

      expect(decoded).toHaveProperty('_id')

    })
  })



})