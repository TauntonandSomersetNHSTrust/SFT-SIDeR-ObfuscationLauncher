import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import audit from '../../loaders/auditlogger';
import logger from '../../loaders/logger'
import config from '../../config';


// const jwt = require('jsonwebtoken');
// Verify using getKey callback
// Uses https://github.com/auth0/node-jwks-rsa as a way to fetch the keys.
// const jwksClient = require('jwks-rsa');


const apiKeys = config.xAPI.apiKeys;

async function getSigningKey(token) {	
	return new Promise((resolve, reject) => {
		const client = jwksClient({
			strictSsl: true, // Default value			
			jwksUri: (config.openID.jwksUri)
		});
		const decoded = jwt.decode(token, {complete: true});
		client.getSigningKey(decoded.header.kid, (err, key) => {
			if(err) {
				logger.error(err);
				reject(err);
			} else {
				const signingKey = key.getPublicKey() // || key.rsaPublicKey;
				resolve(signingKey);
			}
		});
	});
}

const auth = async (req, res, next) => {
    try {
		if(!req.headers.authorization && !req.headers['x-api-key'] && !req.query[config.urlTokenAuth.urlTokenQueryParam]) {
			throw new Error("No authorization details found");
		}
		if(req.headers.authorization){
			logger.debug(`Authorization Header found : ${req.headers.authorization}`);
			const token = req.headers.authorization.split(' ')[1];
			if(token.length < 10) {
				throw new Error(`Invalid token length: ${req.headers.authorization}`);
			}
			
			const signingKey = await getSigningKey(token);
			const options = { ignoreExpiration: false, maxAge : '15m', algorithms: ['RS256'] };
			const claimPath = config.openID.accessClaimPath;
			jwt.verify(token, signingKey, options, (err, vdecoded) => {
					if(err){
						throw new Error('Unable to verify token');
					}
					req.access_token = token;
					req.userData = vdecoded;					
					req.userAccess = vdecoded[claimPath];
					// Check Roles at least one role is present 
					let found = 0;				
			
					(config.openID.accessRoles).forEach((item) => {
						if(req.userAccess.indexOf(item.trim()) !== -1){
							found = 1;
						}
					});
					
					if(found === 0) {
						throw new Error(`Roles not found: ${JSON.stringify(vdecoded)}`);
					}
					
					audit.info(`Audit Success: ${JSON.stringify(vdecoded)}`);
				});
			next();
		} 		
		
		if(req.headers['x-api-key'] && config.xAPI.enabled === true) {
			logger.info(JSON.stringify(apiKeys));
			const apiKey = req.headers['x-api-key'].trim();
			if(apiKey.length == 36 && apiKeys.indexOf(apiKey) > -1){
				audit.info(`Audit Success: X-API-KEY ${apiKey}`);
				next();
				return;
			} else {
				throw new Error(`API Key not valid ${apiKey}`);
			}
		}
		
		if(config.urlTokenAuth.enabled === true && config.urlTokenAuth.urlTokenQueryParam && req.query[config.urlTokenAuth.urlTokenQueryParam]) {
			const token = req.query[config.urlTokenAuth.urlTokenQueryParam];
			if(token.length < 10) {
				throw new Error(`Invalid token length: ${token}`);
			}
					
			const signingKey = await getSigningKey(token);
			const options = { ignoreExpiration: false, maxAge : '15m', algorithms: ['RS256'] };
			const claimPath = config.openID.accessClaimPath;
			jwt.verify(token, signingKey, options, (err, vdecoded) => {
				if(err){
					throw new Error('Unable to verify token');
				}
				req.access_token = token;
				req.userData = vdecoded;					
				req.userAccess = vdecoded[claimPath];
				// Check Roles at least one role is present 
				let found = 0;				

				(config.openID.accessRoles).forEach((item) => {
					if(req.userAccess.indexOf(item.trim()) !== -1){
						found = 1;
						next();
					}
				});
				
				if(found === 0) {
					throw new Error(`Roles not found: ${JSON.stringify(vdecoded)}`);
				}
				
				audit.info(`Audit Success: ${JSON.stringify(vdecoded)}`);
			});
		}
		
        
    } catch (err) {
		audit.error(`Audit Failure: ${err}`);
		logger.error(err);
        res.status(401).json({
			message: "Authorisation failed."
		});
		res.end();
    }
}

export default auth;
