import {DataSource} from "typeorm";
import {SalesManager} from "../entities/salesManager.entity";
import {Slot} from "../entities/slot.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: +(process.env.DATABASE_PORT || 5432),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "mypassword123!",
    database: process.env.DATABASE_NAME || "coding-challenge",
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
