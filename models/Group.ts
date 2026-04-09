export type GroupId = {
  toString(): string;
} | string;

export type Group = {
  _id: GroupId;
  name: string;
  description: string;
  createdAt: Date | string;
};