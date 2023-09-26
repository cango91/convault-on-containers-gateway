const redisClient = require('../utilities/redis-client');
const crypto = require('crypto');

const { AUTH_SERVICE_SECRET } = process.env;
if (!AUTH_SERVICE_SECRET) {
    console.error("Missing required app configuration");
    process.exit(1);
}

BASE_URL = process.env.AUTH_SERVICE_URL ? process.env.AUTH_SERVICE_URL : "http://localhost:3001/services/authentication/api"

const signup = async (req, res, next) => {
    try {
        const response = await fetch(`${BASE_URL}`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {
                'x-service-secret': AUTH_SERVICE_SECRET,
                'Content-Type': 'application/json'
            },
        });
        if (response.ok) {
            const { accessToken, refreshToken } = await response.json();
            res.cookie('refreshToken', refreshToken.token, { signed: true, httpOnly: true });
            res.set('New-Access-Token', accessToken);
            res.status(201).json({ accessToken });
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

const login = async (req, res, next) => {

}

const logout = async (req, res, next) => {

}

const deleteAccount = async (req, res, next) => {
    try {
        const { verificationToken } = req.body;
        const userId = req.user._id;
        if (!userId || !verificationToken) throw new Error("Invalid request");
        const storedToken = await redisClient.get(`deletion:${userId}`);
        if (storedToken !== verificationToken) throw new Error("Invalid verification token");
        const response = await fetch(`${BASE_URL}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId }),
            headers: {
                'x-service-secret': AUTH_SERVICE_SECRET,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            await redisClient.del(`deletion:${userId}`);
            return res.status(204).json({});
        } else {
            throw new Error("Couldn't delete account");
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

const preDeleteAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;
        if (!userId) throw new Error("Invalid request");
        const verificationToken = crypto.randomBytes(16).toString('hex');
        await redisClient.set(`deletion:${userId}`, verificationToken, 'NX', 'EX', 600);
        res.json({ verificationToken });
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

module.exports = {
    signup,
    login,
    logout,
    deleteAccount,
    preDeleteAccount,
}