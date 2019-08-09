# App Explorer
This is the sample application that will list down the Auth0 Registered `Applications`  and `Rules` applied to each of the applications.

![App screenshot](/docs/appexplore.png?raw=true)

## Auth0 Configuration
- Sign in to your Auth0 account. If you don't yet have an Auth0 account, sign up for free.

- You need to first create a `Regular Web Applications` in Auth0. Go to the Auth0 Applications page and click on `Create Application` button. Then select `Regular Web Applications` and click on the `Create` button. 

- Select Node.js from the list of available technologies. Give a name to the client, e.g. AppExplorer

- Add http://localhost:3000/callback to the list of Allowed Callback URLs in the client settings page.

- Create and Authorize a [Machine-to-Machine Application] (https://auth0.com/docs/api/management/v2/create-m2m-app)

- Create a Whitelist Rule with following code

```javascript
function (user, context, callback) {
    if (context.clientName === 'ListAppRulesUsingMngmtApiV2') {
      var whitelist = [ 'youremail@example.com' ]; //authorized users
      var userHasAccess = whitelist.some(
        function (email) {
          return email === user.email;
        });

      if (!userHasAccess) {
        return callback(new UnauthorizedError('Access denied.'));
      }
    }
    callback(null, user, context);
}
```

This way your application can be accessed only by a list of authorized users


## Running the Sample
- Get the code
```bash
git clone https://github.com/zeroth/auth0-app-explorer.git
```

- Install the dependencies.

```bash
npm install
```
or
```bash
yarn
```

- Rename `.env.example` to `.env` and replace the values for `AUTH0_CLIENT_ID`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_SECRET`, `AUTH0_MANAGEMENT_CLIENT_SECRET` and `AUTH0_MANAGEMENT_CLIENT_ID` with your Auth0 credentials. 

- `AUTH0_MANAGEMENT_CLIENT_SECRET` and `AUTH0_MANAGEMENT_CLIENT_ID` can found in Auth0 `Dashboard > APIs > Auth0 Management API > Setting`


- Run the app
```bash
# copy configuration and replace with your own
cp .env.example .env
```

Run the app.

```bash
npm start
```
or 
```bash
yarn start
```

The app will be served at [http://localhost:3000](http://localhost:3000).

## Code Logic
Auth0 Authentication protects this application. The whitelist rule makes sure only authorized users can access this application.

If the user is authorized, the user gets redirected to `/app` and presented with the list of applications and the rules applied to them. Else get redirect to `/forbidden` page and presented with an error message.

On the `/app` page following conditions are handled to show the application with the rules applied to them.

- Check if the rule applies to the specific application. to do so, check the `rule.script` to see if the rules is applied to a specific application by comparing either `context.clientName` or `context.clientID`, i.e check if  `if (context.clientName === 'App Name')` or `if (context.clientID === 'BJF129131928asqadasa')` exists in the rule script. If yes then the rule applies to the application.
- Check if the rule is in the blacklist for a specific application. this is achieved as follow, check for the opposite of the above rule i.e. look negative condition `if (context.clientName !== 'App Name')` or `if (context.clientID !== 'BJF129131928asqadasa')`. If one of them is true means, this rules applies to all the other applications but this.
- If non of the above conditions exists in the `rule.script` it means this rule applies to all the applications.
  
The code for the same exists in `applist.js`

## Pseudo code 
```
Get `rules` from `/api/v2/rules`
Get `clients` from `/api/v2/clients`
for each client in clients:
  for each rule in rules:
    if rule.script has if(context.clientName === {client_name}) :
      if client.name === client_name :
        client.rules.push(rule)
    else if rule.script has if(context.clientID === {client_id}) :
      if client.clientID === client_id :
          client.rules.push(rule)
    else if rule.script has if(context.clientID !== {client_id}) :
        if client.clientID !== client_id :
          client.rules.push(rule)
    else if rule.script has if(context.clientName !== {client_name}) :
        if client.clientName !== client_name :
          client.rules.push(rule)
    else: # there is no condition in the rule.script means this rules applies to all
      client.rules.push(rule)
```
