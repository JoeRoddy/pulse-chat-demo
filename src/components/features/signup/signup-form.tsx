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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    bridg.user
      .create({
        data: { name: slugify(values.name), colorIndex: getRandomInt(0, 9) },
      })
      .then(async (user) => {
        console.log('user created!', user);
        setErrCreatingUser(false);
        saveUser(user);
        // give some time for fake login to process before sending msg
        await new Promise((r) => setTimeout(r, 200));
        await bridg.message.create({
          data: {
            isSystem: true,
            authorId: user.id,
            body: `@${user.name} has joined the chat!`,
          },
        });
        onUserCreated(user);
      })
      .catch((e) => {
        setErrCreatingUser(true);
        console.log('err', e);
      });
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
