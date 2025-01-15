import {SlotRepository} from "../slots.repository";
import {Repository} from "typeorm";
import {Slot} from "../../entities/slot.entity";
import {AppDataSource} from "../../database/dataSource";

jest.mock('../../database/dataSource', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('SlotRepository', () => {
    let repository: SlotRepository;
    let mockTypeOrmRepository: jest.Mocked<Repository<Slot>>;
    let mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        query: jest.fn().mockResolvedValue([])
    };

    beforeEach(() => {
        // Setup mock query builder
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
            query: jest.fn().mockResolvedValue([])
        };

        // Setup mock TypeORM repository
        mockTypeOrmRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            query: jest.fn().mockResolvedValue([])
        } as unknown as jest.Mocked<Repository<Slot>>;

        // Mock AppDataSource.getRepository to return our mock repository
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTypeOrmRepository);

        // Create repository instance
        repository = new SlotRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAvailableSlots', () => {
        it('should create correct query for finding available slots', async () => {
            const date = '2024-05-03';
            const managerIds = [1, 2];

            await repository.findAvailableSlots(date, managerIds);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'slot.start_date::date = :date',
                {date}
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('slot.booked = false');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'slot.sales_manager_id IN (:...managerIds)',
                {managerIds}
            );
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should handle empty manager ids array', async () => {
            await repository.findAvailableSlots('2024-05-03', []);
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should return empty array when no slots found', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await repository.findAvailableSlots('2024-05-03', [1]);
            expect(result).toEqual([]);
        });
    });

    describe('findAllSlots', () => {
        it('should create correct query for finding all slots', async () => {
            const date = '2024-05-03';
            const managerIds = [1, 2];

            await repository.findAllSlots(date, managerIds);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'slot.start_date::date = :request_date',
                {request_date: date}
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'slot.sales_manager_id IN (:...managerIds)',
                {managerIds}
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('slot.start_date', 'ASC');
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should return sorted results', async () => {
            const mockSlots = [
                {id: 1, start_date: new Date('2024-05-03T11:00:00Z')},
                {id: 2, start_date: new Date('2024-05-03T10:30:00Z')}
            ];
            mockQueryBuilder.getMany.mockResolvedValue(mockSlots);

            await repository.findAllSlots('2024-05-03', [1]);
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('slot.start_date', 'ASC');
        });
    });

    describe('findAvailabilityFromDB', () => {
        const mockRequest = {
            date: '2024-05-03',
            language: 'German',
            products: ['SolarPanels', 'Heatpumps'],
            rating: 'Gold'
        };

        it('should execute correct raw query', async () => {
            await repository.findAvailabilityFromDB(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            );

            expect(mockTypeOrmRepository.query).toHaveBeenCalledWith(
                expect.stringContaining('WITH RECURSIVE eligible_managers AS'),
                [mockRequest.date, mockRequest.language, mockRequest.rating, mockRequest.products]
            );
        });

        it('should handle empty result', async () => {
            mockTypeOrmRepository.query.mockResolvedValue([]);

            const result = await repository.findAvailabilityFromDB(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            );

            expect(result).toEqual([]);
        });

        it('should return correctly formatted availability data', async () => {
            const mockDbResponse = [
                {
                    start_date: '2024-05-03T10:30:00.000Z',
                    available_count: '1'
                }
            ];

            mockTypeOrmRepository.query.mockResolvedValue(mockDbResponse);

            const result = await repository.findAvailabilityFromDB(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            );

            expect(result).toEqual(mockDbResponse);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database query failed');
            mockTypeOrmRepository.query.mockRejectedValue(dbError);

            await expect(repository.findAvailabilityFromDB(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            )).rejects.toThrow(dbError);
        });

        it('should match the expected response format', async () => {
            const mockResponse = [
                {
                    start_date: '2024-05-03T10:30:00.000Z',
                    available_count: '1'
                }
            ];

            mockTypeOrmRepository.query.mockResolvedValue(mockResponse);

            const result = await repository.findAvailabilityFromDB(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            );

            result.forEach(slot => {
                expect(slot).toHaveProperty('start_date');
                expect(slot).toHaveProperty('available_count');
                expect(new Date(slot.start_date).toISOString()).toBe(slot.start_date);
                expect(typeof slot.available_count).toBe('string');
            });
        });
    });
});