import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";

import { ObjectId } from "mongodb";

@Entity("emergancy_contact")
export class EmergancyContact{
    @ObjectIdColumn()
    emgCon_id!: ObjectId;

    @Column()
    name!: string;

    @Column()
    title!: string;

    @Column()
    contact!: string;

    @Column()
    description!: string;
}