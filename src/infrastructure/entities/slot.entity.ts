import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index} from "typeorm";
import {SalesManager} from "./salesManager.entity";

@Entity('slots')
@Index('idx_slots_booking', ['sales_manager_id', 'start_date', 'booked'])
export class Slot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamptz'})
    @Index() // Add individual index on start_date for date-based queries
    start_date: Date;

    @Column({type: 'timestamptz'})
    end_date: Date;

    @Column({type: 'boolean'})
    booked: boolean;

    @Column()
    sales_manager_id: number;

    @ManyToOne(() => SalesManager)
    sales_manager: SalesManager;
}