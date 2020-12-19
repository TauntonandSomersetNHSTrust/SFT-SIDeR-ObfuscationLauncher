import { obfuscate } from 'obfuscated-querystring/lib';
import queryString from 'query-string';
import config from '../../config';

const obfuscation = async (req, res, next) => {
	const obfconfig = config.obfuscation;
	const requiredProperties = config.obfuscation.requiredProperties
		
	
	let values = [];
	let keyArray = [];

	// Retrieve all param keys from query and check all essential ones are present
	if (req.query && Object.keys(req.query).length) {
		values = Object.keys(req.query);
	} else {
		res.status(400);
		return next(new Error('Query string missing from request'));
	}

	//	If object provided then take keys of object to then be parsed
	if (requiredProperties) {
		if (Array.isArray(requiredProperties)) {
			keyArray = requiredProperties;
		} else if (typeof requiredProperties === 'object') {
			keyArray = Object.keys(requiredProperties);
		} else {
			res.status(500);
			return next(
				new Error(
					'List of required query keys not passed to server middleware in correct type'
				)
			);
		}
	}

	try {
		if (
			keyArray.every((element) =>
				values
					.map((x) => x.toLowerCase())
					.includes(element.toLowerCase())
			)
		) {
			const obfuscatedParams = obfuscate(
				queryString.stringify(req.query),
				obfconfig
			);

			req.query = queryString.parse(obfuscatedParams);
		} else {
			res.status(400);
			return next(new Error('An essential parameter is missing'));
		}
	} catch (error) {
		res.status(500);
		return next(new Error(error));
	}

	return next();
	
};

export default obfuscation;