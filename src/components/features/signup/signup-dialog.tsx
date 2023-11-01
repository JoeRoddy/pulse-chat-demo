import { SignupForm } from '@/components/features/signup/signup-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function SignupDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    document.getElementById('this-cant-be-right')?.click();
    setTimeout(() => setOpen(true), 200);
  }, []);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Create profile</DialogTitle>
          <DialogDescription>
            Choose your username to get started
          </DialogDescription>
        </DialogHeader>
        <SignupForm
          onUserCreated={() => {
            setOpen(false);
            router.push('/chat');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
