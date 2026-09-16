import { Entity, ObjectIdColumn, Column } from "typeorm";

import { ObjectId } from "mongodb";

@Entity("refresh_tokens")
export class RefreshToken {
  @ObjectIdColumn()
  rt_id!: ObjectId;

  @Column()
  token!: string;

  @Column()
  user_id!: string;

  @Column()
  expiresAt!: string;

  @Column({ default: false })
  revoked!: boolean;

  @Column()
  createdAt!: string;
}