// This module contains the HTTP logic for interfacing with the user service, in cases where the user service must be called from
// application logic. Ideally, the API logic would not do this, but there are some historical reasons that for now, it is unavoidable
const request = require('request')

class userServiceInterface {
    constructor(serviceURL) {
        this.serviceURL = serviceURL
    }
    findByRole(role) {
        return new Promise((resolve, reject) => {
            let options = {
                url: `${ this.serviceURL }/users/role/${ role }` + role,
                method: "GET",
                success: (body) => {
                    resolve(body.count)
                },
                error: (err) => {
                    reject(err)
                }
            }
            request(options)
        })
    }
    createUser(username, email, password, role) {
        let requestBody = {
            username,
            email,
            password,
            role
        };
        
        return new Promise((resolve, reject) => {
            let options = {
                url: `${ this.serviceURL }/users/create`,
                json:requestBody,
                method: "POST",
                success: (body) => {
                	console.log('response', body)
                    resolve(body);
                },
                error: (err) => {
                    reject(err)
                }
            }
            request(options)

        })
    }
}
// Note that userServiceURL is the base path of the API minus the slash!
module.exports = new userServiceInterface(process.env.userServiceURL);