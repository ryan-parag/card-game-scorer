import * as React from 'react';
import { NotificationLayout, NotificationLinks, Paragraph, SITE_URL, previewLinks } from '../../components/NotificationLayout.js';

export interface FriendAcceptedEmailProps extends NotificationLinks {
  friendName: string;
  friendUrl: string;
}

export const FriendAcceptedEmail = ({ friendName, friendUrl, ...links }: FriendAcceptedEmailProps) => (
  <NotificationLayout
    preview={`${friendName} accepted your friend request`}
    heading={`You and ${friendName} are now friends`}
    cta={{ label: `See ${friendName}'s profile`, href: friendUrl }}
    reason="You're getting this because you sent a friend request on ScoreKeeper."
    category="friend"
    {...links}
  >
    <Paragraph>
      Check out your head-to-head record, then settle the score at your next game night.
    </Paragraph>
  </NotificationLayout>
);

FriendAcceptedEmail.PreviewProps = {
  friendName: 'Amanda',
  friendUrl: `${SITE_URL}/u/example`,
  ...previewLinks,
} satisfies FriendAcceptedEmailProps;

export default FriendAcceptedEmail;
