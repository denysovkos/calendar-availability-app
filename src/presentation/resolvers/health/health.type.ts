import {Field, ObjectType} from "type-graphql";

@ObjectType()
export class Health {
    @Field()
    status: string;
}