import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
//import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from 'redis';
import session from 'express-session';

//let RedisStore = require('connect-redis')(session) can become the following two lines using import statement...
import connectRedis from 'connect-redis'
import { MyContext } from "./types";
//const RedisStore = connectRedis(session) this line is used later in the code in the redis section

import cors from 'cors'

const main = async () => {
    //first few steps for the datbase are:
    //1: connect to database
    const orm = await MikroORM.init(microConfig);
    //2: run the migrations
    await orm.getMigrator().up();//you can run the migration through the cli or programmatically (which is what this line does)
    //you could also do const post = new Post('my first post') but youd need to define a constructor
    //3:then run sql
    // const post = orm.em.create(Post, {title: 'my first post'});//simply creates a Post instance
    // await orm.em.persistAndFlush(post); //here, we're actually inserting the specific Post entry into the database
    //however up to this point there is no Post table (until the migration is run)

    const app = express();
    /*app.get('/', (_, res) => { //the underscore '_' represents the req but if it is not used, it's best prctice to use '_'
        res.send("hello");
    })*/

    //======================================redis===========================================
    //Order matters so redis should be initiaized here
    //FOR EXAMPLE: The session middleware will run before the apollo middleware. 
    //This needs to happen because we want to use the session middleware inside of apollo
    const RedisStore = connectRedis(session)

    const redisClient = redis.createClient()
    //this app.use command is necessary for cors to apply to all routes. This is revlavent when using the graphql client
    //You could also specify the specific route.
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))
    app.use(
        session({
            name: 'qid',
            store: new RedisStore({ 
                client: redisClient,
                disableTouch: true//'touch' refreshes the session timer, but we will disable it to lower the number of requests
            }),
            cookie: {//here we are defining the settings for the express session cookie
                //1000 * 60 * 60 * 24 * 365 * 10 is 10 years!
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //where 1000 is 1 second
                httpOnly: true, //thsi means no front end javascript code can access the cookie
                sameSite: 'lax', //something to do with csrf...the ben awad tutorial disnt explain this, instead suggested to google it
                secure: __prod__ //secure makes it so that cookie only works in https (in this case if __prod__ is true since in dev we dont use https)
            },
            saveUninitialized: false, //by default, a session is always saved even if there is no data for the session. However, by setting this to false we are saying we dont want to save sessions with no data
            secret: 'keyboard cat',//put this in an environment variable later
            resave: false,//set to false sothat it doesnt continously ping redis
        })
    );
    //======================================================================================

    const apolloServer = new ApolloServer({ //create a graphql endpoint on express
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        //req is being passed to the context so that the resolvers have access to the session...the res may be needed later
        //also notice that we're destructuring te req, res??? maybe, im not sure
        context: ({req, res}): MyContext => ({ em: orm.em, req, res }) //here you define what special object is accessible by all your resolvers
    });

    apolloServer.applyMiddleware({ app,  cors: false});

    app.listen(4000, () => {
        console.log('server started on localhost:4000')
    });
};

main();
