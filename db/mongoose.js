const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

exports.dbConnection = async () => {
    try {
        const connection = await mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/Gotex')

        console.log('db connection done !');
        return connection
    }
    catch (err) {
        console.error('Database error: ' + err);
        process.exit(1);
    }
};
