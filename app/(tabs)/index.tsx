import { router } from 'expo-router';
import LMSWebView from '../../components/LMSWebView';
import { TAB_URLS } from '../../constants/skilljar';
import { logout } from '../../services/auth';

export default function HomeScreen() {
  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <LMSWebView
      url={TAB_URLS.home}
      onLogout={handleLogout}
    />
  );
}
