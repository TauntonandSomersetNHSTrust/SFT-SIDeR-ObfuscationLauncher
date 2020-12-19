import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
const { obfuscate } = require('obfuscated-querystring/lib');
import queryString from 'query-string';
import auth from '../middlewares/auth'
import obfuscation from '../middlewares/obfuscate'
import tokenexchange from '../middlewares/token-exchange'
import logger from '../../loaders/logger'
import config from '../../config';

const usersRouter = Router();

const fs = require('fs');
const path = require('path');

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 


usersRouter.get('/', auth, tokenexchange, obfuscation, asyncMiddleware((req: Request, res: Response) => {
	logger.debug('Building redirect url');
	if(req) {
		if(req['access_token']) {
			req.query.access_token  = req['access_token'] as string;
			
			const espUrl = config.redirectUrl + queryString.stringify((req.query as { [key: string]: string}));
			// console.log(espUrl);
			res.redirect(espUrl);
		}
	} else {
		return res.status(400).json({error: 'No data'});
	}
}));
  

export default usersRouter;
