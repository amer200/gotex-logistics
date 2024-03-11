const validate = (ajvValidate) => {
    return (req, res, next) => {
        const valid = ajvValidate(req.body)

        if (!valid) {
            const errors = ajvValidate.errors
            let errorsMsg = []
            errors.forEach(err => errorsMsg.push({ msg: err.message }))
            return res.status(400).json({ errors: errorsMsg })
        }
        next()
    }
}

module.exports = validate