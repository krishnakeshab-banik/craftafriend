function getSessionTokenFromHeaders(req) {
    return req.headers.token || req.headers.authorization || req.cookies?.sessionToken || null;
}

module.exports = { getSessionTokenFromHeaders };
