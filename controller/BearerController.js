const fetch = require('node-fetch');
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 750 });

const bearerController = {
    getBearer: async (req, res) => {
        const response = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
            method: 'POST', 
            headers: {
                Authorization: "Basic " + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
            }
        });

        const bearer = await response.json();
        return(bearer);
    },
    validateBearer: async (req, res) => {
        if (cache.has('bearer')) {
            const ping = await fetch('https://api.bol.com/utils/v4/ping', {
                method: 'GET',
                headers: {
                    Accept: "application/json",
                    'Content-Type': 'application/json',
                    Authorization: "Bearer " + cache.get('bearer').access_token
                }
            });

            console.log(ping);

            if (ping.status === 200) {
                return({
                    status: res.statusCode,
                    data: { 
                        bearer: cache.get('bearer') 
                    }
                });
            } else if (ping.status === 500) {
                const bearer = await bearerController.getBearer();
                cache.set('bearer', bearer);
                return({
                    status: res.statusCode,
                    data: { 
                        fresh: true,
                        bearer 
                }})
            } else {
                return({status: ping.status})
            }
        } else {
            const bearer = await bearerController.getBearer();
            cache.set('bearer', bearer);
            return({
                status: res.statusCode,
                data: { 
                    fresh: true,
                    bearer 
            }});
        }
    } 
}

module.exports = bearerController;