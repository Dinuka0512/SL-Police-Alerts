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
}