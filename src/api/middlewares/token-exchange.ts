import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import audit from '../../loaders/auditlogger';
import logger from '../../loaders/logger'
import config from '../../config';

const request = require("request");


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

async function getOpenIDEndpoints(){
	return new Promise((resolve, reject) => {
		const options = {
			method: 'GET',
			url: (config.downstreamAuth.openID.wellKnown),
			headers: { 'accept': 'application/json' }
		};
		
		request(options, (error, response) => {
			if (error) reject(new Error(error));
			// console.log(response.statusCode);
			if(response.statusCode === 200) {
				resolve(JSON.parse(response.body));
			} else {
				reject(JSON.stringify({responseCode : response.statusCode, responseBody: response.body}));
			}
		});
		
	});
}

async function serviceAuthenticate(tokenUrl) {
	return new Promise((resolve, reject) => {		
		const options = {
			method: 'POST',
			url: (tokenUrl),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			form: {
				client_id: (config.downstreamAuth.openID.clientID),
				grant_type: 'client_credentials',
				client_secret: (config.downstreamAuth.openID.clientIDSecret),
				requested_token_type: 'urn:ietf:params:oauth:token-type:access_token'
			}
		};

		request(options, (error, response, body) => {
			if (error) reject(new Error(error));
			// console.log(response.statusCode);
			if(response.statusCode === 200) {
				resolve(JSON.parse(body));
			} else {
				reject(JSON.stringify({responseCode : response.statusCode, responseBody: response.body}));
			}
		});
	});
}


async function serviceTokenExchange(tokenUrl,subjectToken,user) {
	return new Promise((resolve, reject) => {		
		const username = '';
		const password = '';
		const options = {
			method: 'POST',
			url: (tokenUrl),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			form: {
				grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
				requested_subject: user, 
				subject_token: subjectToken, 
				client_id: (config.downstreamAuth.openID.clientID),				
				client_secret: (config.downstreamAuth.openID.clientIDSecret),
				requested_token_type:'urn:ietf:params:oauth:token-type:access_token',
				audience: config.downstreamAuth.openID.targetClient
			}
		};

		request(options, (error, response, body) => {
			if (error) reject(new Error(error));
			// console.log(response.statusCode);
			if(response.statusCode === 200) {
				resolve(JSON.parse(body));
			} else {
				reject(JSON.stringify({responseCode : response.statusCode, responseBody: response.body}));
			}
		});
	});
}

const tokenexchange = async (req, res, next) => {
	logger.debug('Checking downstream auth requirements');
    try {
		// console.log(config.downstreamAuth.enabled);
		// console.log(config.downstreamAuth.type);
		// console.log(config.downstreamAuth.openID.method);
		if(config.downstreamAuth.enabled && config.downstreamAuth.type === 'openid' && config.downstreamAuth.openID.method === 'token-exchange') {
			logger.debug('OpenID token exchange required');
			let token = req.access_token;
			const targetClient = config.downstreamAuth.openID.targetClient;
			const openIDData = await getOpenIDEndpoints()
			// console.log(openIDData);
			const serviceAuth = await serviceAuthenticate(openIDData['token_endpoint']);
			// console.log(serviceAuth);
			const targetuser = req.query['practitioner'].split('|')[1];
			// console.log(targetuser);
			const serviceExchange = await serviceTokenExchange(openIDData['token_endpoint'],serviceAuth['access_token'],targetuser)
			// console.log(serviceExchange)
			req.access_token = serviceExchange['access_token'];
			next();
			
		} else {
			throw new Error('Method not supported');
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

export default tokenexchange;
