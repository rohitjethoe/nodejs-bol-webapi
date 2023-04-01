const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");
const cors = require("cors");
const BearerController = require("./controller/BearerController");
require("dotenv").config();

const cache = new NodeCache({ stdTTL: 750 });

const App = module.exports = express();
App.use(express.json());
App.use(cors()); // * all origins allowed.

App.get('/', (req, res) => {
    res.send({ 
        status: res.statusCode,
        github_repository: "https://github.com/rohitjethoe/nodejs-bol-wrapper" 
    });
});

// /api/validate?auth=API_KEY
App.get('/api/validate', async (req, res) => {
    const key = req.query['auth'];

    if (key === process.env.API_KEY) { 
        const data = await BearerController.validateBearer(req, res);
        res.send(data);
    } else {
        res.send({status: 401, message: "Unauthorized, please provide a valid API key."});
    }
});

// /api/books/:query?auth=API_KEY
App.get('/api/books/:query', async (req, res) => {
    const key = req.query['auth'];

    if (key === process.env.API_KEY) { 
        const query = req.params.query
        const bearer = await BearerController.validateBearer(req, res);

        const response = await fetch(`https://api.bol.com/catalog/v4/search?q=${query}&ids=8299`, {
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                Authorization: `Bearer ${bearer.data.bearer.access_token}`
            }
        });

        const data = await response.json();
        res.send({data});
    } else {
        res.send({status: 401, message: "Unauthorized, please provide a valid API key."});
    }
})

App.use((req, res) => {
    res.status(404);
    res.send({ status: res.statusCode, error: `Sorry, I couldn't find '${req.originalUrl}'` });
});

if (!module.partent) {
    const PORT = process.env.PORT || 7777;
    App.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
