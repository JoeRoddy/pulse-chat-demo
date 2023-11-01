import ChatAvatar from '@/components/features/chat/chat-avatar';
import { WithTooltip } from '@/components/ui/tooltip';
import { Message, User } from '@prisma/client';
import moment from 'moment';

const ChatMessage: React.FC<{
  message: Message;
  author?: User;
  isMyMessage?: boolean;
}> = ({ message, author, isMyMessage }) => {
  const isSystemMessage = message.isSystem;
  return (
    <div
      key={message.id}
      className={`w-full ${
        isMyMessage ? 'justify-end' : isSystemMessage ? 'justify-center' : ''
      } flex gap-1  break-words`}
    >
      {!isSystemMessage && author && !isMyMessage && (
        <ChatAvatar user={author} />
      )}
      {isSystemMessage ? (
        <div className="text-slate-400">{message.body}</div>
      ) : (
        <WithTooltip
          tooltipText={moment(message.createdAt).fromNow()}
          side="left"
        >
          <div
            className={`rounded-xl p-2 max-w-[80%] ${
              isMyMessage ? 'bg-indigo-600 text-white' : ' bg-slate-200'
            }`}
          >
            {message.body}
          </div>
        </WithTooltip>
      )}
    </div>
  );
};

export default ChatMessage;
