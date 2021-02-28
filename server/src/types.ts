
import {Request, Response} from 'express';
import { Redis } from "ioredis";
import { createUpvoteLoader } from './utils/createUpvoteLoader';
import { createUserLoader } from './utils/createUserLoader';

export type MyContext = {
    
    //the two types for req are Request and {session: Express.Session }. The second type isnt necessary to
    //explicitly define however it was done so that in the resolver file user.ts, the default type for session is
    //session? where ? indicates that it could be undefined. Here we state that we want session to be Express.Session type
    req: Request & {session: Express.Session };//the typescript & joins the two types together
    res: Response;
    redisClient: Redis;
    userLoader: ReturnType<typeof createUserLoader>;
    upvoteLoader: ReturnType<typeof createUpvoteLoader>;
};