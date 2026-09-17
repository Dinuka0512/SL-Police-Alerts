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

  @Column({ default: "" })
  code!: string;

  @Column({ default: "" })
  description!: string;

  @Column({ default: "Active" })
  status!: string;

  @Column({ default: "" })
  createdAt!: string;
}
