const config = require('config')

module.exports = function(){
  if (!config.get('jwtPrivateKey') && !process.env.gomez-kitchen_jwtPrivateKey){
    throw new Error('FATAL ERROR: JWT Private Key is not defined')
  }
}