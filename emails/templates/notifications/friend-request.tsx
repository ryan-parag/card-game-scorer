import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface FriendRequestEmailProps extends NotificationLinks {
  requesterName: string;
  requesterUrl: string;
}

export const FriendRequestEmail = ({ requesterName, requesterUrl, ...links }: FriendRequestEmailProps) => (
  <NotificationLayout
    preview={`${requesterName} wants to be friends on ScoreKeeper`}
    heading={`${requesterName} sent you a friend request`}
    cta={{ label: 'View request', href: `${SITE_URL}/friends` }}
    reason="You're getting this because someone added you on ScoreKeeper."
    category="friend"
    {...links}
  >
    <Paragraph>
      Accept to see each other's stats, head-to-head records and recent games.{' '}
      <a href={requesterUrl} className="text-stone-900 underline">See {requesterName}'s profile</a>.
    </Paragraph>
  </NotificationLayout>
);

FriendRequestEmail.PreviewProps = {
  requesterName: 'Amanda',
  requesterUrl: `${SITE_URL}/u/example`,
  ...previewLinks,
} satisfies FriendRequestEmailProps;

export default FriendRequestEmail;
