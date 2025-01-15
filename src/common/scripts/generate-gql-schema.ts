import "reflect-metadata";
import {buildGraphqlSchema} from "../../presentation/routes";

Promise.resolve()
    .then(async () => {
        await buildGraphqlSchema();
    });