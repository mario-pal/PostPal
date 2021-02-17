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
    const apolloServer = new ApolloServer({ //create a graphql endpoint on express
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: false
        }),
        context: () => ({ em: orm.em }) //here you define what special object is accessible by all your resolvers
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log('server started on localhost:4000')
    });
};

main();
