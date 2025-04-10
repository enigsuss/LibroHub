import { gql } from '@apollo/client';

export const GET_BOOKS_BY_USER = gql`
  query GetBooksByUser($userId: ID!) {
    booksByUser(userId: $userId) {
      id
      title
      author
      coverImage
      service
      createdAt
    }
  }
`;
