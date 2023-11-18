import { WithTooltip } from '@/components/ui/tooltip';
import { User } from '@prisma/client';

const ChatAvatar: React.FC<{ user: User }> = ({ user }) => (
  <WithTooltip tooltipText={`@${user.name}`}>
    <div
      style={{ backgroundColor: colorHexes[user?.colorIndex || 0] }}
      className="cursor-default h-10 w-10 rounded-full text-white flex items-center justify-center"
    >
      {slugNameToInitials(user?.name || '')}
    </div>
  </WithTooltip>
);

export default ChatAvatar;

const slugNameToInitials = (slugName: string) => {
  const [first, second] = slugName.split('_');

  return first
    ? `${first?.at(0)?.toUpperCase()}${
        second ? second?.at(0)?.toUpperCase() : ''
      }`
    : '?';
};

const colorHexes = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#059669',
];
