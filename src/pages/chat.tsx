'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Message, User } from '@prisma/client';
import { useLocalStorage, usePrevious } from '@uidotdev/usehooks';
import bridg from 'bridg';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Props {}

// This is obv not the right way to do this, just for demo purposes
const ChatScreen: NextPage<Props> = ({}) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const i = setTimeout(() => {
      setLoaded(true);
    }, 200);
  }, []);

  return loaded ? <Chat /> : <></>;
};

const newMessageSchema = z.object({
  body: z.string().min(2, {
    message: 'Message must be at least 2 characters.',
  }),
});

const Chat: NextPage<Props> = ({}) => {
  const [user, saveUser] = useLocalStorage<User | null>('user', null);
  const router = useRouter();
  const messageBox = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const prevMessages = usePrevious(messages);

  const scrollToEnd = (behavior: 'smooth' | 'instant' = 'instant') => {
    if (messageBox.current) {
      messageBox.current.scrollTo({
        top: messageBox.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const behavior = prevMessages?.length === 0 ? 'instant' : 'smooth';
    scrollToEnd(behavior);
  }, [messages.length]);

  useEffect(() => {
    (async () => {
      const messages = await bridg.message.findMany({ take: 25, orderBy: { createdAt: 'desc' } });
      setMessages(messages.reverse());
      scrollToEnd('smooth');

      // @ts-ignore
      const subscription = await bridg.message.subscribe({ create: { after: {} } });
      if (subscription instanceof Error) return console.error('err', subscription);

      for await (const event of subscription) {
        console.log('event', event);
        setMessages((prev) => [...prev, event.after]);
        scrollToEnd('smooth');
      }
    })();
  }, []);

  const form = useForm<z.infer<typeof newMessageSchema>>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: { body: '' },
  });

  function onSubmit(values: z.infer<typeof newMessageSchema>) {
    console.log('creating', values);
    console.log('bridg', bridg);

    bridg.message
      .create({ data: { ...values, authorId: user?.id as string } })
      .then((msg) => {
        console.log('msg created!', msg);
        // setErrCreatingUser(false);
        // saveUser(user);
        form.reset();
      })
      .catch((e) => {
        // setErrCreatingUser(true);
        console.log('err', e);
      });
  }

  return (
    <div className="">
      CHAT PAGE
      <div className="fixed inset-0 bg-gray-50">
        <div className="absolute inset-0 bottom-16 px-10 py-2 overflow-y-auto" ref={messageBox}>
          <Button
            onClick={() => {
              saveUser(null);
              router.push('/');
            }}
          >
            Sign out
          </Button>
          <Button onClick={() => scrollToEnd('smooth')}>scroll</Button>
          <div className="flex flex-col gap-2">
            {messages?.map((m, i) => {
              const isMyMessage = m.authorId === user?.id;

              return (
                <div key={m.id} className={`w-full ${isMyMessage ? 'justify-end' : ''} flex gap-1  break-words`}>
                  {!isMyMessage && <div className="h-10 w-10 bg-red-200 rounded-full"></div>}
                  <div className={`rounded-xl p-2 max-w-[80%] ${isMyMessage ? 'bg-slate-900 text-white' : ' bg-slate-200'}`}>{m.body}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-5 left-0 right-0 px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Hey guys.." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};
export default ChatScreen;

const generateFakeMessages = (): Message[] =>
  new Array(20).fill(1).map((u, i) => ({
    authorId: '',
    body: 'hello world_' + randomString(1500) + i,
    createdAt: new Date(),
    updatedAt: new Date(),
    id: '',
  }));

// get random number in range
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

//   generate random string of random length
const randomString = (maxLeng: number) => {
  const length = getRandomInt(1, maxLeng);
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) result += i % 5 === 0 ? ' ' : characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
};

const fakeMessages = generateFakeMessages();
