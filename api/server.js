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

app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
//app.use('/player', require('./routes/player'));
//app.use('/inventory', require('./routes/inventory'));

app.listen(3000, () => {
    console.log('REST API running on port 3000');
});
