const jwt = require('jsonwebtoken');
const {AUTH_SERVICE_SECRET} = process.env;
const BASE_URL = process.env.AUTH_URL ? process.env.AUTH_URL : 'http://localhost:3001/services/authentication/api'
module.exports = (req, res, next) => {
    // check jwt
    let token = req.get('Authorization');
    if (!token) return res.status(401).json({ message: 'You are not authorized to perform this action' });
    token = token.replace('Bearer ', '');
    jwt.verify(token, process.env.JWT_SECRET, async (error, decodedToken) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                // attempt a refresh
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
                    req.user = jwt.decode(newAccessToken).user;
                    res.locals.noManualRefresh = true;
                } else {
                    res.clearCookie('refreshToken');
                    return res.status(401).json({ message: "Couldn't refresh token" });
                }
            } else {
                return res.status(401).json({ message: "Invalid token" });
            }
        } else {
            req.user = decodedToken.user;
        }
        return next();
    });
}