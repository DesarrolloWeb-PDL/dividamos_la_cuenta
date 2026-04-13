export type UserId = {
  toString(): string;
} | string;

export type User = {
  _id: UserId;
  groupId: string;
  name: string;
  phone: string;
  alias: string;
  paymentHandle?: string;
};
