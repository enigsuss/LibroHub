import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { BookRow } from '@/types/db';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GraphQL 스키마 정의
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    userId: String!
    createdAt: String!
    coverImage: String!
    service: String!
  }

  type Query {
    booksByUser(userId: ID!): [Book]
    book(id: ID!): Book
  }

  type Mutation {
    addBook(title: String!, author: String!, userId: ID!): Book
  }
`;

// GraphQL 리졸버
const resolvers = {
  Query: {
    booksByUser: async (_parent: unknown, args: { userId: string }) => {
      const [rows] = await pool.query<BookRow[]>('SELECT * FROM books WHERE user_id = ?', [
        args.userId,
      ]);
      return rows.map((row) => ({
        ...row,
        createdAt: row.created_at,
      }));
    },
  },
};

// Apollo Server 인스턴스 생성 및 Next.js 핸들러 연결
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
