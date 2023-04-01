const express = require("express");
const NodeCache = require("node-cache");
const cors = require("cors");
require("dotenv").config();

const cache = new NodeCache({ stdTTL: 750 });

const App = express();
App.use(express.json());
App.use(cors());

App.get('/', (req, res) => {
    res.send({ 
        status: res.statusCode,
        github_repository: "https://github.com/rohitjethoe/boekjes-api" 
    });
})

const getBearer = async () => {
    const response = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
        method: 'POST', 
        headers: {
            Authorization: "Basic " + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
        }
    });

    const bearer = await response.json();
    return(bearer);
}

App.get('/api', async (req, res) => {
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
            res.send({data: cache.get('bearer')});
        } else if (ping.status === 500) {
            const bearer = await getBearer();
            cache.set('bearer', bearer);
            res.send({data: { 
                fresh: true,
                bearer 
            }})
        } else {
            res.send({status: ping.status})
        }
    } else {
        const bearer = await getBearer();
        cache.set('bearer', bearer);
        res.send({data: { 
            fresh: true,
            bearer 
        }});
    }
})

const PORT = process.env.PORT || 3000;

App.listen(PORT, () => console.log(`Server started on port ${PORT}`));
