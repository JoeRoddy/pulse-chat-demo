import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@prisma/client';
import { useLocalStorage } from '@uidotdev/usehooks';
import bridg from 'bridg';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
});

export function SignupForm({ onUserCreated }: { onUserCreated: (user: User) => void }) {
  const [user, saveUser] = useLocalStorage<User | null>('user', null);
  const [errCreatingUser, setErrCreatingUser] = useState(false);

  useEffect(() => {
    user && onUserCreated(user);
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    bridg.user
      .create({ data: values })
      .then((user) => {
        console.log('user created!', user);
        setErrCreatingUser(false);
        saveUser(user);
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
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {errCreatingUser && <p className="text-sm font-medium text-red-500 dark:text-red-900">Error creating user</p>}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
