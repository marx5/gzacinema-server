const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        }
    }
)

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection successful");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(1);
    }
}

module.exports = { sequelize, connectDB };