import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Message, User } from '@prisma/client';
import { Tooltip, TooltipContent, TooltipContentProps, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useLocalStorage, usePrevious } from '@uidotdev/usehooks';
import bridg from 'bridg';
import moment from 'moment';
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

const newMessageSchema = z.object({
  body: z.string().min(2, {
    message: 'Message must be at least 2 characters.',
  }),
});

const Chat: React.FC<{}> = ({}) => {
  const [user, saveUser] = useLocalStorage<User | null>('user', null);
  const router = useRouter();
  if (!user) router.push('/');
  const messageBox = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const prevMessages = usePrevious(messages);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = () => bridg.user.findMany().then((users) => setUsers(users));

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
    (async () => {
      await fetchUsers();
      const messages = await bridg.message.findMany({ take: 25, orderBy: { createdAt: 'desc' } });
      setMessages(messages.reverse());

      // @ts-ignore
      const subscription = await bridg.message.subscribe({ create: { after: {} } });
      if (subscription instanceof Error) return console.error('err', subscription);

      for await (const event of subscription) {
        console.log('event', event);

        if (!event.after.isSystem && !users?.some((u) => u.id === event.after.authorId)) fetchUsers();
        // fixes seeing yourself join twice
        if (messages.some((m) => m.id === event.after?.id)) return;
        setMessages((prev) => [...prev, event.after]);
      }
    })();
  }, []);

  const form = useForm<z.infer<typeof newMessageSchema>>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: { body: '' },
  });

  function onSubmit(values: z.infer<typeof newMessageSchema>) {
    bridg.message
      .create({ data: { ...values, authorId: user?.id as string } })
      .then((msg) => form.reset())
      .catch((e) => {
        console.log('err', e);
      });
  }

  return (
    <div className="">
      CHAT PAGE
      <div className="fixed inset-0 bg-gray-50 ">
        <div className="bg-indigo-900 opacity-80 z-10 text-white sticky top-0 h-14 shadow-lg flex items-center px-5 justify-between">
          <div className="flex text-2xl font-medium gap-2">
            <div className="font-normal">bridg.chat</div>
          </div>

          <div className="flex items-center gap-3">
            @{user?.name}
            <Button
              // className="bg-white text-slate-950"
              variant={'secondary'}
              onClick={() => {
                saveUser(null);
                router.reload();
              }}
              // className="mb-4"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="absolute pt-20 top-0 left-0 right-0 bottom-16 overflow-y-auto p-10" ref={messageBox}>
          {/* <div className="w-full flex justify-end">
           
          </div> */}

          {/* <Button onClick={() => scrollToEnd('smooth')}>scroll</Button> */}
          <div className="flex flex-col gap-2">
            {messages?.map((m, i) => {
              const isSystemMessage = m.isSystem;
              const isMyMessage = m.authorId === user?.id;

              const author = users?.find((u) => u.id === m.authorId);

              return (
                <div key={m.id} className={`w-full ${isMyMessage ? 'justify-end' : isSystemMessage ? 'justify-center' : ''} flex gap-1  break-words`}>
                  {!isSystemMessage && author && !isMyMessage && <MessageAvatar user={author} />}
                  {isSystemMessage ? (
                    <div className="text-slate-400">{m.body}</div>
                  ) : (
                    <WithTooltip tooltipText={moment(m.createdAt).fromNow()} side="left">
                      <div className={`rounded-xl p-2 max-w-[80%] ${isMyMessage ? 'bg-indigo-600 text-white' : ' bg-slate-200'}`}>{m.body}</div>
                    </WithTooltip>
                  )}
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

const MessageAvatar: React.FC<{ user: User }> = ({ user }) => {
  return (
    <WithTooltip tooltipText={user?.name}>
      <div style={{ backgroundColor: colorHexes[user?.colorIndex || 0] }} className="cursor-default h-10 w-10 rounded-full  text-white flex items-center justify-center">
        {slugToInitials(user?.name || '')}
      </div>
    </WithTooltip>
  );
};

const WithTooltip: React.FC<{ children: React.ReactNode; tooltipText: string; side?: TooltipContentProps['side'] }> = ({ children, tooltipText, side = 'top' }) => {
  return tooltipText ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="bg-slate-950 text-white p-2 rounded-md">
          <p className="">{tooltipText}</p>
          {side === 'top' && <div className="absolute -bottom-1 rounded-sm bg-slate-950 h-3 w-3 left-[45%] rotate-45" />}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <>{children}</>
  );
};

// convert slug to first two initials
const slugToInitials = (slug: string) => {
  const [first, second] = slug.split('_');
  console.log([first, second]);

  return first ? `${first?.at(0)?.toUpperCase()}${second ? second?.at(0)?.toUpperCase() : ''}` : '?';
};

const colorHexes = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F97316', '#059669'];
