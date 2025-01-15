import {Slot} from "../entities/slot.entity";
import {AppDataSource} from "../database/dataSource";

export interface IAvailabilityQueryResult {
    start_date: string;
    available_count: number;
}

export interface ISlotRepository {
    findAvailableSlots(date: string, managerIds: number[]): Promise<Slot[]>;
    findAllSlots(date: string, managerIds: number[]): Promise<Slot[]>;
    findAvailabilityFromDB(date: string, language: string, products: string[], rating: string): Promise<IAvailabilityQueryResult[]>;
}

export class SlotRepository implements ISlotRepository {
    constructor(private readonly slotRepository = AppDataSource.getRepository(Slot)) {}

    async findAvailableSlots(date: string, managerIds: number[]): Promise<Slot[]> {
        return this.slotRepository
            .createQueryBuilder('slot')
            .where('slot.start_date::date = :date', {date})
            .andWhere('slot.booked = false')
            .andWhere('slot.sales_manager_id IN (:...managerIds)', {managerIds})
            .getMany();
    }

    async findAllSlots(date: string, managerIds: number[]): Promise<Slot[]> {
        return this.slotRepository
            .createQueryBuilder('slot')
            .where('slot.start_date::date = :request_date', {request_date: date})
            .andWhere('slot.sales_manager_id IN (:...managerIds)', {managerIds})
            .orderBy('slot.start_date', 'ASC')
            .getMany();
    }

    async findAvailabilityFromDB(
        date: string,
        language: string,
        products: string[],
        rating: string
    ): Promise<IAvailabilityQueryResult[]> {
        return await this.slotRepository.query(
            `WITH RECURSIVE eligible_managers AS (
                SELECT id
                FROM sales_managers
                WHERE $2 = ANY(languages)
                  AND $3 = ANY(customer_ratings)
                  AND products @> $4::varchar[]
                 ),
                 time_slots AS (
             SELECT DISTINCT start_date, end_date
             FROM slots
             WHERE start_date::date = $1::date
                 ),
                 available_managers AS (
             SELECT
                 t.start_date,
                 t.end_date,
                 em.id as manager_id
             FROM time_slots t
                 CROSS JOIN eligible_managers em
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM slots s
                 WHERE s.sales_manager_id = em.id
               AND s.booked = true
               AND s.start_date < t.end_date
               AND s.end_date > t.start_date
                 )
               AND EXISTS (
                 SELECT 1
                 FROM slots s
                 WHERE s.sales_manager_id = em.id
               AND s.booked = false
               AND s.start_date = t.start_date
               AND s.end_date = t.end_date
                 )
                 )
            SELECT
                to_char(start_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as start_date,
                COUNT(*) as available_count
            FROM available_managers
            GROUP BY start_date
            ORDER BY start_date ASC;`,
            [date, language, rating, products]
        );
    }
}