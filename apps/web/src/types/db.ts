import { RowDataPacket } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
}

export interface BookRow extends RowDataPacket {
  id: number;
  title: string;
  author: string;
  user_id: string;
  coverImage: string;
  service: string;
  created_at: string;
}
