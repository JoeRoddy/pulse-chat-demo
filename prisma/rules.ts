import { DbRules } from 'bridg/server';

// https://github.com/joeroddy/bridg#database-rules
export const rules: DbRules = {
  default: false,
  user: {
    find: (uid) => !!uid, // logged in
    create: (uid) => !uid, // not logged in
  },
  message: {
    find: (uid) => !!uid, // logged in

    // logged in and is taking ownership of the msg
    create: (uid, data) => !!uid && data?.authorId === uid,
  },
};
