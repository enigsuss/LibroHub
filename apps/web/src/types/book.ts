export interface Book {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  service: string;
  userId: string;
  image: string;
  publisher?: string;
  orderDate?: string;
  status?: string;
  progress?: string;
  expiredAt?: string;
  price?: string;
  url?: string;
  usagePeriod?: string;
}

export type NormalizedBook = {
  title: string;
  author: string;
  image: string;
  link: string;
  orderDate: string;
  usagePeriod: string;
  site: string;
};
