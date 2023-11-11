import ChatMessage from '@/components/features/chat/chat-message';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import useUser from '@/hooks/useUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Message, User } from '@prisma/client';
import { usePrevious } from '@uidotdev/usehooks';
import bridg from 'bridg';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// This is obv not the right way to do this, just hacking for demo purposes
const ChatScreen: NextPage<{}> = ({}) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 200);
  }, []);

  return loaded ? <Chat /> : <></>;
};

export default ChatScreen;

const newMessageSchema = z.object({
  body: z.string().min(2, {
    message: 'Message must be at least 2 characters.',
  }),
});

const Chat: React.FC<{}> = ({}) => {
  const [user, saveUser] = useUser();
  const router = useRouter();

  const messageBox = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const prevMessages = usePrevious(messages);
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () =>
    bridg.user.findMany().then((users) => setUsers(users));

  const scrollToEnd = (behavior: ScrollBehavior | undefined) =>
    messageBox?.current?.scrollTo({
      top: messageBox.current.scrollHeight,
      behavior,
    });

  useEffect(() => {
    const behavior = prevMessages?.length === 0 ? 'instant' : 'smooth';
    scrollToEnd(behavior as ScrollBehavior);
  }, [messages.length]);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      await loadUsers();
      const messages = await bridg.message.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
      });
      setMessages(messages.reverse());

      // @ts-ignore
      const subscription = await bridg.message.subscribe({
        create: { after: {} },
      });
      if (subscription instanceof Error)
        return console.error('err', subscription);

      for await (const event of subscription) {
        console.log('event', event);
        const newMsg = event.after;

        newMsg.authorId &&
          !users?.some((u) => u.id === newMsg.authorId) &&
          loadUsers();

        // fixes duplicate rendered join messages when you login
        if (messages.some((m) => m.id === newMsg?.id)) return;
        setMessages((prev) => [...prev, newMsg]);
      }
    })();
  }, [user?.id]);

  const form = useForm<z.infer<typeof newMessageSchema>>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: { body: '' },
  });

  if (user === null) {
    router.push('/');
    return <></>;
  } else if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="fixed inset-0 bg-gray-50 ">
        <div className="bg-indigo-900 opacity-80 z-10 text-white sticky top-0 h-14 shadow-lg flex items-center px-5 justify-between">
          <div className="flex text-2xl font-medium gap-2">
            <div className="font-normal">bridg.chat</div>
          </div>
          <div className="flex items-center gap-3">
            @{user.name}
            <Button
              variant={'secondary'}
              onClick={() => {
                saveUser(null);
                router.reload();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
        <div
          className="absolute pt-20 top-0 left-0 right-0 bottom-16 overflow-y-auto p-10"
          ref={messageBox}
        >
          <div className="flex flex-col gap-2">
            {messages?.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isMyMessage={msg.authorId === user.id}
                author={
                  msg.authorId
                    ? users?.find((u) => u.id === msg.authorId)
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 left-0 right-0 px-10">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                bridg.message
                  .create({ data: { ...values, authorId: user.id as string } })
                  .then((msg) => form.reset())
                  .catch((e) => console.log('err sending msg:', e)),
              )}
              className="space-y-8"
            >
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
