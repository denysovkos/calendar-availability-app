import {DataSource} from "typeorm";
import {SalesManager} from "../entities/salesManager.entity";
import {Slot} from "../entities/slot.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "mypassword123!",
    database: "coding-challenge",
    synchronize: true,
    logging: process.env.NODE_ENV !== 'test',
    entities: [SalesManager, Slot],
    subscribers: [],
    migrations: [],
});

export const initDatabase = async (): Promise<void> => {
    await AppDataSource.initialize();
};

export const killDatabaseConnection = async (): Promise<void> => {
    await AppDataSource.close();
};
