const winston = require('winston')

module.exports = function(err, req, res, next){
  winston.log({
    level: 'error', 
    message: err.message, 
    metadata: err
  })
  res.status(500).send('Something failed')
}