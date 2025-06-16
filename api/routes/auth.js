const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const pool = require('../db');
const router = express.Router();

const SECRET = 'your_secret';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Crée un nouveau compte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compte créé
 *       400:
 *         description: Erreur (doublon ou invalide)
 */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
        res.status(201).send({ success: true });
    } catch (err) {
        res.status(400).send({ error: 'User already exists' });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d’un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT retourné
 *       401:
 *         description: Identifiants incorrects
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) return res.status(401).send({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.rows[0].password);
    if (!match) return res.status(401).send({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.rows[0].id, username }, SECRET);
    res.send({ token });
});

module.exports = router;
