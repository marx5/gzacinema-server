require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await sequelize.sync({ alter: true });
    console.log('Database connected and models synchronized');

    app.listen(PORT, () => {
        console.log(`Server is running on  http://localhost:${PORT}`);
    });
}

startServer();