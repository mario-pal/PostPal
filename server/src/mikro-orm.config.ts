import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { MikroORM } from "@mikro-orm/core";
import path from 'path'; //this is a function built into node

/*export default {
    entities: [Post],
    dbName: 'lireddit',
    user: 'mario',
    password: 'pg',
    type: 'postgresql',
    debug: !__prod__, //check constants.ts
} as const; This works fine but it wont give you autocomplete suggestions.
*/ 

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/ //the j was added to also recognize javascript files
    },
    entities: [Post, User],
    dbName: 'lireddit',
    user: 'mario',
    password: 'pg',
    type: 'postgresql',
    debug: !__prod__, //check constants.ts
} as Parameters<typeof MikroORM.init>[0];
//Parameters is a typescript keyword

//I'm able to access this object's info from the cli
//because of this config file and the path to this file 
//was also added to package.json 