import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";

import { ObjectId } from "mongodb";

@Entity("users")
export class User {
  @ObjectIdColumn()
  u_id!: ObjectId;

  @Column()
  name!: string;

  @Column()
  police_id!: string;

  @Column()
  department!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column()
  contact!: string;

  @Column({ default: "Police Officer" })
  role!: string;

  @Column({ default: "Active" })
  status!: string;

  @Column({ default: "" })
  createdAt!: string;

  @Column({ default: "" })
  lastActive!: string;
}