import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse<null | any>) {
  //   if (req.method !== 'POST') return res.status(405).send('');
  const result = await prisma.message.create({
    data: {
      authorId: 'clof15atq0006lffyjihxt3n2',
      body: 'hi ling ',
    },
  });
  if (result) return res.status(200).json(result);
}
