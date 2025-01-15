import {Query, Resolver} from "type-graphql";
import {Health} from "./health.type";

@Resolver(Health)
export class HealthResolver {
    constructor() {}

    @Query(() => Health)
    async health(): Promise<{ health: string }> {
        return {
            health: "alive",
        };
    }
}