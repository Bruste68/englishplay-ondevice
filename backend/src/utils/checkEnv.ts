// ✅ src/utils/checkEnv.ts
const REQUIRED_ENV = {
  google: ['GOOGLE_WEB_CLIENT_ID', 'GOOGLE_WEB_CLIENT_SECRET'],
  naver: ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'],
  line: ['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET'],
  yahoo: ['YAHOO_CLIENT_ID', 'YAHOO_CLIENT_SECRET'],
};

export function checkOAuthEnv() {
  Object.entries(REQUIRED_ENV).forEach(([provider, vars]) => {
    const missing = vars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      console.error(`❌ ${provider} 환경 변수 누락: ${missing.join(', ')}`);
    } else {
      console.log(`✅ ${provider} 환경 변수 정상`);
    }
  });
}
