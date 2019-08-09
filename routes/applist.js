const axios = require("axios");
const querystring = require('querystring');

const express = require('express');
const secured = require('../lib/middleware/secured');
const router = express.Router();

const auth0Domain = `https://${process.env.AUTH0_DOMAIN}`
const managementApiTokenURL = `${auth0Domain}/oauth/token`;

const managementApiTokenRequest = {
    grant_type: 'client_credentials',
    client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
    client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    audience: `${auth0Domain}/api/v2/`
}


/* GET app list. */
router.get('/app', secured(), async (req, res, next) => {
    try {

        let mmToken = await axios.post(managementApiTokenURL, querystring.stringify(managementApiTokenRequest));

        let rulesRef = await axios.get(`${auth0Domain}/api/v2/rules`,
            { headers: { 'Authorization': `Bearer ${mmToken.data.access_token}` } });

        let clientsRef = await axios.get(`${auth0Domain}/api/v2/clients?fields=name%2Cclient_id&include_fields=true`,
            { headers: { 'Authorization': `Bearer ${mmToken.data.access_token}` } });

        let clients = clientsRef.data;
        let rules = rulesRef.data;
        clients = clients.filter((client)=>{
            return client.name !== 'All Applications'
        })


        let clientRuleMap = clients.map((client)=>{
            let obj = Object.assign({}, {
                name:client.name,
                rules: null
            })
            let rulesForClient = rules.filter((rule)=>{
                let checkIfClientName = rule.script.match(/if\s*\(context\.clientName === \'([^\']+)\'\)/);
                let checkIfClientId = rule.script.match(/if\s*\(context\.clientID === \'([^\']+)\'\)/);
                let checkIfNotClientName = rule.script.match(/if\s*\(context\.clientName !== \'([^\']+)\'\)/);
                let checkIfNotClientId = rule.script.match(/if\s*\(context\.clientID !== \'([^\']+)\'\)/);

                if(checkIfClientName) {
                    return checkIfClientName[1] === client.name;
                }
                else if(checkIfClientId) {
                    return checkIfClientId[1] === client.client_id;
                }
                else if(checkIfNotClientName) {
                    return checkIfNotClientName[1] !== client.name;
                } 
                else if(checkIfNotClientId) {
                    return checkIfNotClientId[1] !== client.client_id;
                } else {
                    return true;
                }
            })

            obj.rules = rulesForClient.reduce((acc, current)=>{
                acc.push(current.name);
                return acc;
            }, [])
            
            return obj;
        })

        res.render('applist', {
            appMap: clientRuleMap,
            title: 'Application List and rules applied to them'
        });


    } catch (error) {
        next(error)
    }
});

module.exports = router;