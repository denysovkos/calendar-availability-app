import {ManagerAvailabilityService} from './managerAvailability.service';
import {SalesManagerRepository} from '../../infrastructure/repositories/salesManager.repository';
import {SlotRepository} from '../../infrastructure/repositories/slots.repository';
import {SalesManager} from '../../infrastructure/entities/salesManager.entity';
import {Slot} from '../../infrastructure/entities/slot.entity';

// Mock repositories
jest.mock('../../infrastructure/repositories/salesManager.repository');
jest.mock('../../infrastructure/repositories/slots.repository');

describe('ManagerAvailabilityService', () => {
    let service: ManagerAvailabilityService;
    let mockSalesManagerRepository: jest.Mocked<SalesManagerRepository>;
    let mockSlotRepository: jest.Mocked<SlotRepository>;

    beforeEach(() => {
        mockSalesManagerRepository = new SalesManagerRepository() as jest.Mocked<SalesManagerRepository>;
        mockSlotRepository = new SlotRepository() as jest.Mocked<SlotRepository>;
        service = new ManagerAvailabilityService(
            mockSalesManagerRepository,
            mockSlotRepository
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAvailabilityFromDB', () => {
        it('should return availability data from DB', async () => {
            const mockRequest = {
                date: '2024-05-03',
                products: ['SolarPanels', 'Heatpumps'],
                language: 'German',
                rating: 'Gold'
            };

            const mockResponse = [
                {start_date: '2024-05-03T10:30:00.000Z', available_count: 1},
                {start_date: '2024-05-03T11:00:00.000Z', available_count: 1},
                {start_date: '2024-05-03T11:30:00.000Z', available_count: 1}
            ];

            mockSlotRepository.findAvailabilityFromDB.mockResolvedValue(mockResponse);

            const result = await service.getAvailabilityFromDB(mockRequest);

            expect(result).toEqual(mockResponse);
            expect(mockSlotRepository.findAvailabilityFromDB).toHaveBeenCalledWith(
                mockRequest.date,
                mockRequest.language,
                mockRequest.products,
                mockRequest.rating
            );
        });
    });

    describe('getAvailabilityInRuntime', () => {
        const createMockSalesManager = (id: number, languages: string[], products: string[], ratings: string[]): SalesManager => ({
            id,
            name: `Seller ${id}`,
            languages,
            products,
            customer_ratings: ratings
        });

        const createMockSlot = (managerId: number, startTime: string, booked: boolean): Slot => ({
            id: Math.random(),
            sales_manager_id: managerId,
            start_date: new Date(startTime),
            end_date: new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
            booked,
            sales_manager: null as unknown as SalesManager
        });

        it('should return correct availability for a single eligible manager', async () => {
            const mockManager = createMockSalesManager(
                2,
                ['German', 'English'],
                ['SolarPanels', 'Heatpumps'],
                ['Gold', 'Silver', 'Bronze']
            );

            const mockSlots = [
                createMockSlot(2, '2024-05-03T10:30:00.000Z', false),
                createMockSlot(2, '2024-05-03T11:00:00.000Z', false),
                createMockSlot(2, '2024-05-03T11:30:00.000Z', false)
            ];

            mockSalesManagerRepository.findByCriteria.mockResolvedValue([mockManager]);
            mockSlotRepository.findAllSlots.mockResolvedValue(mockSlots);

            const result = await service.getAvailabilityInRuntime({
                date: '2024-05-03',
                products: ['SolarPanels', 'Heatpumps'],
                language: 'German',
                rating: 'Gold'
            });

            expect(result).toEqual([
                {start_date: '2024-05-03T10:30:00.000Z', available_count: 1},
                {start_date: '2024-05-03T11:00:00.000Z', available_count: 1},
                {start_date: '2024-05-03T11:30:00.000Z', available_count: 1}
            ]);
        });

        it('should handle overlapping booked slots correctly', async () => {
            const mockManager = createMockSalesManager(
                2,
                ['German', 'English'],
                ['SolarPanels', 'Heatpumps'],
                ['Gold', 'Silver', 'Bronze']
            );

            const mockSlots = [
                createMockSlot(2, '2024-05-04T10:30:00.000Z', true),
                createMockSlot(2, '2024-05-04T11:00:00.000Z', false),
                createMockSlot(2, '2024-05-04T11:30:00.000Z', true)
            ];

            mockSalesManagerRepository.findByCriteria.mockResolvedValue([mockManager]);
            mockSlotRepository.findAllSlots.mockResolvedValue(mockSlots);

            const result = await service.getAvailabilityInRuntime({
                date: '2024-05-04',
                products: ['SolarPanels', 'Heatpumps'],
                language: 'German',
                rating: 'Gold'
            });

            expect(result).toEqual([]);
        });

        it('should return empty array when no managers match criteria', async () => {
            mockSalesManagerRepository.findByCriteria.mockResolvedValue([]);

            const result = await service.getAvailabilityInRuntime({
                date: '2024-05-03',
                products: ['SolarPanels', 'Heatpumps'],
                language: 'French', // Non-existent language
                rating: 'Gold'
            });

            expect(result).toEqual([]);
            expect(mockSlotRepository.findAllSlots).not.toHaveBeenCalled();
        });

        it('should filter out managers that dont have all requested products', async () => {
            const mockManager = createMockSalesManager(
                1,
                ['German'],
                ['SolarPanels'], // Only has SolarPanels
                ['Bronze']
            );

            mockSalesManagerRepository.findByCriteria.mockResolvedValue([mockManager]);

            const result = await service.getAvailabilityInRuntime({
                date: '2024-05-03',
                products: ['SolarPanels', 'Heatpumps'], // Requesting both products
                language: 'German',
                rating: 'Bronze'
            });

            expect(result).toEqual([]);
            expect(mockSlotRepository.findAllSlots).not.toHaveBeenCalled();
        });

        it('should handle multiple eligible managers correctly', async () => {
            const mockManagers = [
                createMockSalesManager(2, ['German', 'English'], ['Heatpumps'], ['Gold', 'Silver']),
                createMockSalesManager(3, ['German', 'English'], ['Heatpumps'], ['Gold', 'Silver'])
            ];

            const mockSlots = [
                createMockSlot(2, '2024-05-03T11:30:00.000Z', false),
                createMockSlot(3, '2024-05-03T11:30:00.000Z', false)
            ];

            mockSalesManagerRepository.findByCriteria.mockResolvedValue(mockManagers);
            mockSlotRepository.findAllSlots.mockResolvedValue(mockSlots);

            const result = await service.getAvailabilityInRuntime({
                date: '2024-05-03',
                products: ['Heatpumps'],
                language: 'English',
                rating: 'Silver'
            });

            expect(result).toEqual([
                {start_date: '2024-05-03T11:30:00.000Z', available_count: 2}
            ]);
        });
    });
});