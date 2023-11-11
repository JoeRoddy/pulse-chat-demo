import { User } from '@prisma/client';
import { useLocalStorage } from '@uidotdev/usehooks';
import bridg from 'bridg';
import { useEffect, useState } from 'react';

export default function useUser(): [
  User | null | undefined,
  (user: User | null) => void,
] {
  const [user, saveUser] = useLocalStorage<User | null>('user', null);
  const [authedUser, setAuthedUser] = useState<User | null>();

  useEffect(() => {
    if (!user?.id) return setAuthedUser(null);
    // mock auth
    bridg
      .$sendWebsocketMessage({
        type: 'authenticate',
        token: user.id,
      })
      .then(() => setAuthedUser(user));
  }, [user?.id]);

  return [authedUser, saveUser];
}
