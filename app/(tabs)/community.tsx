import { SafeAreaView, StatusBar } from 'react-native';
import LMSWebView from '../../components/LMSWebView';
import { COMMUNITY_BASE_URL, BRAND } from '../../constants/skilljar';

export default function CommunityTab() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.dark1 }}>
      <StatusBar barStyle="light-content" />
      <LMSWebView url={COMMUNITY_BASE_URL} />
    </SafeAreaView>
  );
}
