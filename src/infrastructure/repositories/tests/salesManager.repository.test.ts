import {SalesManagerRepository} from "../salesManager.repository";
import {Repository} from "typeorm";
import {SalesManager} from "../../entities/salesManager.entity";
import {AppDataSource} from "../../database/dataSource";

jest.mock('../../database/dataSource', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('SalesManagerRepository', () => {
    let repository: SalesManagerRepository;
    let mockTypeOrmRepository: jest.Mocked<Repository<SalesManager>>;
    let mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
    };

    beforeEach(() => {
        // Setup mock query builder
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([])
        };

        // Setup mock TypeORM repository
        mockTypeOrmRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
        } as unknown as jest.Mocked<Repository<SalesManager>>;

        // Mock AppDataSource.getRepository to return our mock repository
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTypeOrmRepository);

        // Create repository instance
        repository = new SalesManagerRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findByCriteria', () => {
        it('should create correct query for finding sales managers', async () => {
            const language = 'German';
            const products = ['SolarPanels', 'Heatpumps'];
            const rating = 'Gold';

            await repository.findByCriteria(language, products, rating);

            // Verify query builder was called correctly
            expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('sales_manager');

            // Verify where clauses
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                ':language = ANY(sales_manager.languages)',
                {language}
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':products && sales_manager.products',
                {products}
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':rating = ANY(sales_manager.customer_ratings)',
                {rating}
            );

            // Verify getMany was called
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should return empty array when no managers match criteria', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await repository.findByCriteria('French', ['SolarPanels'], 'Platinum');

            expect(result).toEqual([]);
        });

        it('should return matching managers', async () => {
            const mockManagers = [
                {
                    id: 1,
                    name: 'Seller 1',
                    languages: ['German'],
                    products: ['SolarPanels'],
                    customer_ratings: ['Bronze']
                },
                {
                    id: 2,
                    name: 'Seller 2',
                    languages: ['German', 'English'],
                    products: ['SolarPanels', 'Heatpumps'],
                    customer_ratings: ['Gold', 'Silver', 'Bronze']
                }
            ];

            mockQueryBuilder.getMany.mockResolvedValue(mockManagers);

            const result = await repository.findByCriteria('German', ['SolarPanels'], 'Bronze');

            expect(result).toEqual(mockManagers);
        });

        it('should handle array parameters correctly', async () => {
            const language = 'English';
            const products = ['Heatpumps'];
            const rating = 'Silver';

            await repository.findByCriteria(language, products, rating);

            // Verify parameters were passed correctly
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                ':language = ANY(sales_manager.languages)',
                expect.objectContaining({language})
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':products && sales_manager.products',
                expect.objectContaining({products})
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':rating = ANY(sales_manager.customer_ratings)',
                expect.objectContaining({rating})
            );
        });

        it('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            mockQueryBuilder.getMany.mockRejectedValue(dbError);

            await expect(repository.findByCriteria('German', ['SolarPanels'], 'Gold'))
                .rejects
                .toThrow(dbError);
        });

        it('should work with single product', async () => {
            await repository.findByCriteria('German', ['SolarPanels'], 'Gold');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':products && sales_manager.products',
                {products: ['SolarPanels']}
            );
        });

        it('should work with multiple products', async () => {
            await repository.findByCriteria('German', ['SolarPanels', 'Heatpumps'], 'Gold');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                ':products && sales_manager.products',
                {products: ['SolarPanels', 'Heatpumps']}
            );
        });
    });
});