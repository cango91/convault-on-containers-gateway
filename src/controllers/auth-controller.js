const redisClient = require('../utilities/redis-client');
const crypto = require('crypto');

const { AUTH_SERVICE_SECRET } = process.env;
if (!AUTH_SERVICE_SECRET) {
    console.error("Missing required app configuration");
    process.exit(1);
}

const BASE_URL = process.env.AUTH_SERVICE_URL ? process.env.AUTH_SERVICE_URL : "http://localhost:3001/services/authentication/api"

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
    console.log(BASE_URL);
    try {
        const response = await fetch(`${BASE_URL}/login`, {
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
            res.json({ accessToken });
        } else {
            throw new Error("Couldn't login");
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

const logout = async (req, res, next) => {
    try {
        const accessToken = req.get('Authorization').replace('Bearer ', "");
        const refreshToken = req.signedCookies['refreshToken'];
        const response = await fetch(`${BASE_URL}/logout`, {
            method: 'POST',
            body: JSON.stringify({ accessToken, refreshToken }),
            headers: {
                'x-service-secret': AUTH_SERVICE_SECRET,
                'Content-Type': 'application/json'
            },
        });
        if (response.ok) {
            res.clearCookie('refreshToken');
            res.status(204).json({});
        } else {
            throw new Error("Couldn't logout");
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
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

const reauth = async (req, res, next) => {
    try {
        if (res.locals.noManualRefresh) {
            return res.status(204).json({});
        } else {
            let token = req.get('Authorization');
            if (!token) return res.status(401).json({ message: 'You are not authorized to perform this action' });
            token = token.replace('Bearer ', '');
            let refreshToken = req.signedCookies['refreshToken'];
            if (!refreshToken) return res.status(401).json({ message: "Refresh token not found" });
            const url = `${BASE_URL}/refresh`;
            const body = {
                accessToken: token,
                refreshToken: {
                    token: refreshToken
                },
            };
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'x-service-secret': AUTH_SERVICE_SECRET,
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
                res.cookie('refreshToken', newRefreshToken, { signed: true, httpOnly: true });
                req.headers['Authorization'] = `Bearer ${newAccessToken}`;
                res.set('New-Access-Token', newAccessToken);
                return res.status(204).json({});
            } else {
                throw new Error("Couldn't refresh token");
            }
        }
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
    reauth,
}