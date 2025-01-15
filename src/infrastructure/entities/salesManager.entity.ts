import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity('sales_managers')
export class SalesManager {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 250})
    name: string;

    @Column('varchar', {array: true, length: 100})
    languages: string[];

    @Column('varchar', {array: true, length: 100})
    products: string[];

    @Column('varchar', {array: true, length: 100})
    customer_ratings: string[];
}