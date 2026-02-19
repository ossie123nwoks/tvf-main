import React from 'react';
import { View } from 'react-native';
import InvitationLanding from '@/components/ui/InvitationLanding';

interface InvitationPageProps {
  code: string;
}

export default function InvitationPage({ code }: InvitationPageProps) {
  return (
    <View style={{ flex: 1 }}>
      <InvitationLanding
        invitationCode={code}
        onInvitationLoaded={(invitation) => {
          console.log('Invitation loaded:', invitation);
        }}
        onInvitationError={(error) => {
          console.error('Invitation error:', error);
        }}
      />
    </View>
  );
}
