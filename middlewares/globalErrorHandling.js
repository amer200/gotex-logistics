const ApiError = require("../utils/ApiError")

/**
 * @desc It's a middleware to handling errors
 */
const globalErrorHandling = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, res)
    } else {
        if (err.name === 'JsonWebTokenError') {
            err = new ApiError(401, 'Invalid token. Please login again.')
        }
        if (err.name === 'TokenExpiredError') {
            err = new ApiError(401, 'Expired token. Please login again.')
        }
        if (err.code === 11000) {
            err = new ApiError(401, `This ${Object.keys(err.keyValue)[0]} is used before.`)
        }

        sendErrorForProd(err, res)
    }
}

const sendErrorForDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}
const sendErrorForProd = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
}

module.exports = globalErrorHandling