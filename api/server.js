const express = require('express');
const app = express();
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Swagger config
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MMORPG API',
            version: '1.0.0',
            description: 'API pour login, register, joueurs, etc.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Middlewares essentiels
app.use(cors());
app.use(express.json()); // Pour le JSON
app.use(express.urlencoded({ extended: true })); // Pour le x-www-form-urlencoded

// ✅ Routes
app.use('/auth', require('./routes/auth'));
app.use('/characters', require('./routes/characters'));

// ✅ Lancement du serveur
app.listen(3000, () => {
    console.log('REST API running on port 3000');
});