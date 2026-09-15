import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";

import { ObjectId } from "mongodb";

@Entity("departments")
export class Department {
  @ObjectIdColumn()
  d_id!: ObjectId;

  @Column()
  name!: string;
}