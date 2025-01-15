import {
    ISalesManagerRepository,
    SalesManagerRepository,
} from "../../infrastructure/repositories/salesManager.repository";
import {
    ISlotRepository,
    SlotRepository,
} from "../../infrastructure/repositories/slots.repository";

export interface IGetAvailabilityRequest {
    date: string;
    products: string[];
    language: string;
    rating: string;
}

export interface IGetAvailabilityResponse {
    start_date: string;
    available_count: number;
}

export class ManagerAvailabilityService {
    constructor(
        private readonly salesManagerRepository: ISalesManagerRepository = new SalesManagerRepository(),
        private readonly slotRepository: ISlotRepository = new SlotRepository(),
    ) {}

    private isOverlapping(slot1StartDate: Date, slot1EndDate: Date, slot2StartDate: Date, slot2EndDate: Date): boolean {
        return slot1StartDate < slot2EndDate && slot2StartDate < slot1EndDate;
    }

    async getAvailabilityFromDB(request: IGetAvailabilityRequest): Promise<IGetAvailabilityResponse[]> {
        return this.slotRepository.findAvailabilityFromDB(
            request.date,
            request.language,
            request.products,
            request.rating
        );
    }

    async getAvailabilityInRuntime(request: IGetAvailabilityRequest): Promise<IGetAvailabilityResponse[]> {
        // Step 1: Find matching sales managers
        const matchingManagers = await this.salesManagerRepository.findByCriteria(
            request.language,
            request.products,
            request.rating
        );

        if (!matchingManagers.length) {
            return [];
        }

        // Filter managers to ensure they have ALL requested products
        const eligibleManagers = matchingManagers.filter(manager =>
            request.products.every(product => manager.products.includes(product))
        );

        if (!eligibleManagers.length) {
            return [];
        }

        const managerIds = eligibleManagers.map((manager) => manager.id);

        // Step 2: Fetch all slots for the matching managers
        const allSlots = await this.slotRepository.findAllSlots(request.date, managerIds);

        // Step 3: Group slots by start time
        const slotGroups: { [startTime: string]: Set<number> } = {};

        // Initialize all time slots
        allSlots.forEach((slot) => {
            const startTimeKey = slot.start_date.toISOString();
            if (!slotGroups[startTimeKey]) {
                slotGroups[startTimeKey] = new Set<number>();
            }
        });

        // Step 4: For each time slot, determine which managers are actually available
        const result: IGetAvailabilityResponse[] = [];

        Object.keys(slotGroups).sort().forEach((startTimeKey) => {
            const currentStartDate = new Date(startTimeKey);
            const currentEndDate = new Date(currentStartDate.getTime() + 60 * 60 * 1000); // Add 1 hour

            // For each manager, check if they have an unbooked slot at this time
            // AND no overlapping booked slots
            const availableManagerIds = new Set<number>();

            eligibleManagers.forEach(manager => {
                // Check if manager has an unbooked slot at this time
                const hasUnbookedSlot = allSlots.some(slot =>
                    slot.sales_manager_id === manager.id &&
                    !slot.booked &&
                    slot.start_date.getTime() === currentStartDate.getTime()
                );

                if (!hasUnbookedSlot) return;

                // Check for any overlapping booked slots
                const hasOverlappingBooking = allSlots.some(slot =>
                    slot.sales_manager_id === manager.id &&
                    slot.booked &&
                    slot.start_date < currentEndDate &&
                    new Date(slot.end_date) > currentStartDate
                );

                if (!hasOverlappingBooking) {
                    availableManagerIds.add(manager.id);
                }
            });

            if (availableManagerIds.size > 0) {
                result.push({
                    start_date: startTimeKey,
                    available_count: availableManagerIds.size
                });
            }
        });

        return result;
    }
}