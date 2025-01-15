import {AppDataSource} from "../database/dataSource";
import {SalesManager} from "../entities/salesManager.entity";

export interface ISalesManagerRepository {
    findByCriteria(language: string, products: string[], rating: string): Promise<SalesManager[]>;
}

export class SalesManagerRepository implements ISalesManagerRepository {
    constructor(private readonly salesManagerRepository = AppDataSource.getRepository(SalesManager)) {}

    async findByCriteria(language: string, products: string[], rating: string): Promise<SalesManager[]> {
        return this.salesManagerRepository
            .createQueryBuilder('sales_manager')
            .where(':language = ANY(sales_manager.languages)', {language})
            .andWhere(':products && sales_manager.products', {products})
            .andWhere(':rating = ANY(sales_manager.customer_ratings)', {rating})
            .getMany();
    }
}