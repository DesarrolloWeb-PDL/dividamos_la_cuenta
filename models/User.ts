export type UserId = {
  toString(): string;
} | string;

export type User = {
  _id: UserId;
  name: string;
  phone: string;
  alias: string;
};
