import "reflect-metadata";
import {buildGraphqlSchema} from "../../presentation/resolvers";

Promise.resolve()
    .then(async () => {
        await buildGraphqlSchema();
    })