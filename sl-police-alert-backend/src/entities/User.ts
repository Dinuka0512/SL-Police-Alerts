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

}