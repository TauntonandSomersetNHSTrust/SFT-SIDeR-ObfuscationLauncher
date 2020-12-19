import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
	/* Payload Security */
	payLoadLimit : process.env.payLoadLimit,
	
	/* Cors */
	cors: {
		enabled: process.env.corsEnabled,
		domains: (process.env.allowedOrigins).split(',')	
	},
	
	/* Auth */
	xAPI : {
		enabled: process.env.EnabledAuthMethods.trim().toLowerCase().split(',').indexOf('xapikey') >= 0 ? true : false,
		apiKeys: process.env.XApiKeysPermitted.trim().split(',').map(a => {
		  return a.trim();
		}),
	},	
	urlTokenAuth : {
		enabled: process.env.EnabledAuthMethods.trim().toLowerCase().split(',').indexOf('url-token') >= 0 ? true : false,
		urlTokenQueryParam: process.env.urlTokenQueryParam.trim()
	},
	
	/* Service OpenID Auth */
	openID : {
		enabled : process.env.EnabledAuthMethods.trim().toLowerCase().split(',').indexOf('openid') >= 0 ? true : false,
		wellKnown : process.env.openIDBaseURL.trim() + '/.well-known/openid-configuration',
		jwksUri : process.env.jwksUri.trim(),
		clientID : process.env.openIDClientID,
		clientIDSecret : process.env.openIDClientSecret,
		accessClaimPath : process.env.AccessClaimPath.trim(),
		accessRoles : process.env.AccessRolesAllowed.trim().split(',').map(a => {
		  return a.trim();
		}),
	},
	
	/* Service Downstream auth */
	downstreamAuth: {
		enabled : process.env.downstreamAuthRequired,
		type : process.env.downstreamMethod.trim().toLowerCase(),
		openID : {
			enabled : process.env.downstreamMethod.trim().toLowerCase().split(',').indexOf('openid') >= 0 ? true : false,
			method : process.env.openIDDownstreamOpenIDMethod.trim().toLowerCase(),
			wellKnown : process.env.openIDDownstreamEnpoint.trim() + '/.well-known/openid-configuration',
			clientID : process.env.openIDDownstreamClientID,
			clientIDSecret : process.env.openIDDownstreamClientSecret,
			accessClaimPath : process.env.openIDDownstreamClaimPath.trim(),
			accessRoles : process.env.openIDDownstreamRoles.trim().split(',').map(a => {
			  return a.trim();
			}),
			targetClient : process.env.openIDDownstreamTargetClientID
		}		
	},
	
	/* Service port */
	port: parseInt(process.env.listenOn, 10),
	

	/* Database */
	database : {
		type : process.env.dbType,
		databaseURL: process.env.dbUrl		
	},
	
	/* Winston logger*/
	logs: {
		level: process.env.logLevel || 'debug',
		fileLogging: {
			enabled: process.env.fileLoggingEnabled,
			filelocation: process.env.fileLogDir
		},
		auditLogging: {
			enabled: process.env.auditfileLoggingEnabled,
			filelocation: process.env.auditfileLogDir
		}
	},
	
	/* API configs */
	api: {
		prefix: '/api',
	},
	
	
	/* SIDeR */
	redirectUrl: process.env.redirectUrl,
	
	obfuscation: {
		encryptionKey: {
			name: process.env.obfuscationKeyName.trim(),
			value: process.env.obfuscationKey.trim()
		},
		obfuscate: process.env.obfuscatedParams.trim().split(',').map(a => {
		  return a.trim();
		}),
		requiredProperties: process.env.obfuscatedRequiredParams.trim().split(',').map(a => {
		  return a.trim();
		}),
	}
};