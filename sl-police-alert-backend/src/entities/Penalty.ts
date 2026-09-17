import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";

import { ObjectId } from "mongodb";

@Entity("penalties")
export class Penalty {
  @ObjectIdColumn()
  p_id!: ObjectId;

  @Column({ default: "" })
  code!: string;

  @Column()
  violation!: string;

  @Column()
  fee!: string;

  @Column({ default: "" })
  vehicle!: string;

  @Column({ default: "" })
  nic!: string;

  @Column({ default: "" })
  location!: string;

  @Column()
  date!: string;

  @Column({ default: "Not paid" })
  status!: string;

  @Column({ default: "" })
  issuedBy!: string;

  @Column({ default: "" })
  createdAt!: string;
}