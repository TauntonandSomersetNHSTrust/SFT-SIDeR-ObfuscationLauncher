import { Router } from 'express';
import login from './routes/login';
import status from './routes/status';
import launch from './routes/launch';

// guaranteed to get dependencies

const routes = Router();
routes.use('/status', status);
routes.use('/login', login);
routes.use('/launch', launch);


export default routes;