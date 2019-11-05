const winston = require('winston')
require('express-async-errors')

module.exports = function(){
  
  winston.exceptions.handle(
    new winston.transports.File({ filename: 'uncaughtExceptions.log'})
  )
  
  process.on('unhandledRejection', (ex) => {
    throw ex
  })
  
  winston
    .add(new winston.transports.File({ filename: 'logfile.log'}))
    .add(new winston.transports.Console({
      format: winston.format.combine(winston.format.simple()),
      handleExceptions: true
    }))
  
}