import { Signup } from '@/components/features/signup-dialog';
import { User } from '@prisma/client';
import { NextPage } from 'next';
import { useRef, useState } from 'react';

let editCount = 0;

const BridgExample: NextPage = ({}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [exampleUser, setExampleUser] = useState<User>();
  const subRef = useRef<any>();
  console.log('hello');

  return (
    <div className="">
      <Signup />
    </div>
  );
};

export default BridgExample;
