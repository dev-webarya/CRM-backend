const morgan = require('morgan');

const morganMiddleware = () => {
  if (process.env.NODE_ENV === 'development') {
    return morgan('dev');
  }
  return morgan('combined');
};

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

module.exports = {
  morganMiddleware,
  requestLogger
};
