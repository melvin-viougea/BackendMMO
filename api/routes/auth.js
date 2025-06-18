const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const pool = require('../db'); // PostgreSQL pool
const router = express.Router();

const SECRET = 'your_secret'; // À stocker en variable d’environnement

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
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compte créé
 *       400:
 *         description: Utilisateur ou email déjà existant
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Champs manquants' });
    }

    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Utilisateur ou email déjà enregistré' });
        }

        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hash]
        );

        res.status(201).json({ success: true, message: 'Utilisateur enregistré avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
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
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants incorrects
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, password FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }

        // Générer un token unique (comme en PHP)
        const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

        // Enregistrer dans la table des sessions actives
        await pool.query(
            'INSERT INTO active_sessions (user_id, session_token) VALUES ($1, $2)',
            [user.id, token]
        );

        res.status(200).json({ status: 'success', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;