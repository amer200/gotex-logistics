/**
 * @desc This class is responsible about operational errors (error I can predict)
 */

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error' // status~400 -> fail , status~500 -> error
        this.isOperational = true // == is it predictable for me
    }
}

module.exports = ApiError