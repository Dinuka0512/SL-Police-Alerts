import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";

import { ObjectId } from "mongodb";

@Entity("messages")
export class Message {
  @ObjectIdColumn()
  m_id!: ObjectId;

  @Column()
  image!: string;

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column()
  date!: Date;

  @Column()
  time!: string;

  @Column({ default: "Medium" })
  priority!: string;

  @Column({ default: "Sent" })
  status!: string;

  @Column({ default: "" })
  sentBy!: string;

  @Column({ type: "json", default: [] })
  departments!: { departmentId: string; status: string }[];
}