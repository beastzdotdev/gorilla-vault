import { Button } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { useInjection } from 'inversify-react';
import { useNavigate } from 'react-router-dom';
import { ProfileStore } from './state/profile.store';
import { constants } from '../../shared/constants';

export const ProfilePage = observer((): React.JSX.Element => {
  const navigate = useNavigate();
  const profile = useInjection(ProfileStore);

  const WebSignOut = async () => {
    try {
      navigate(constants.path.signIn);
    } catch (e: unknown) {
      // showErrorMessage(handleFirebaseError(e));
    }
  };

  return (
    <>
      <p>id: {profile.user.id}</p>
      <p>email: {profile.user.email}</p>
      <p>userName: {profile.user.userName}</p>
      <p>birthDate: {profile.user.birthDate}</p>
      <p>gender: {profile.user.gender}</p>
      <br />
      <Button icon="log-out" intent="primary" text="Sign out" onClick={WebSignOut} />
    </>
  );
});
