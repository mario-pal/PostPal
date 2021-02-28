import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

export const isAuth:MiddlewareFn<MyContext> = ({context}, next) => { //this runs before the resolver
    console.log(context.req.session);
    if(!context.req.session.userId){
        throw new Error("not authenticated");
    }

    return next();
}