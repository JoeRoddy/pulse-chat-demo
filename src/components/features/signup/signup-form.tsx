import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import useUser from '@/hooks/useUser';
import { getRandomInt, slugify } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@prisma/client';
import bridg from 'bridg';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
});

export function SignupForm({
  onUserCreated,
}: {
  onUserCreated: (user: User) => void;
}) {
  const [user, saveUser] = useUser();
  const [errCreatingUser, setErrCreatingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    bridg.user
      .create({
        data: { name: slugify(values.name), colorIndex: getRandomInt(0, 8) },
      })
      .then(async (user) => {
        console.log('user created!', user);
        setErrCreatingUser(false);
        saveUser(user);
        // give some time for fake login to process before sending msg
        await new Promise((r) => setTimeout(r, 1000));
        await bridg.message.create({
          data: {
            isSystem: true,
            authorId: user.id,
            body: `@${user.name} has joined the chat!`,
          },
        });
        onUserCreated(user);
        setIsLoading(false);
      })
      .catch((e) => {
        setErrCreatingUser(true);
        console.log('err', e);
      });
  }

  if (user) {
    onUserCreated(user);

    return <></>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Michael Scarn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {errCreatingUser && (
          <p className="text-sm font-medium text-red-500 dark:text-red-900">
            Error creating user
          </p>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
    </Form>
  );
}
