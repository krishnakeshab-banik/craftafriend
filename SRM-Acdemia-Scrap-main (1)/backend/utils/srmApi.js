const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const SRM_DOMAIN = 'https://academia.srmist.edu.in';

async function createSrmApiClient(sessionCookieString = null) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    if (sessionCookieString) {
        const cookies = sessionCookieString.split(';').map(c => c.trim());
        for (const cookie of cookies) {
            if (cookie) {
                try {
                    await jar.setCookie(cookie, SRM_DOMAIN);
                } catch (err) {
                    // Ignore invalid cookies
                }
            }
        }
    }

    return client;
}

module.exports = { createSrmApiClient, SRM_DOMAIN };
