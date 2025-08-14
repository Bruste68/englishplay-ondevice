// purchase.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../lib/api';
import { useLanguage } from '../hooks/useLanguage';

const productIds = ['monthly_kr', 'semiannual_kr', 'annual_kr'];

export default function PurchaseScreen() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [iapAvailable, setIapAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const isDeviceConflict = params?.reason === 'device_conflict';

  const purchaseUpdateSub = useRef<RNIap.PurchaseUpdatedListener>();
  const purchaseErrorSub = useRef<RNIap.PurchaseErrorListener>();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);

        // 1) IAP 연결
        const connected = await RNIap.initConnection();
        setIapAvailable(connected);
        console.log('✅ IAP 연결 성공:', connected);
        if (!connected) throw new Error('E_IAP_NOT_AVAILABLE');

        // 2) 보류 결제 캐시 정리 (Android 권장)
        try {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        } catch {}

        // 3) 상품 조회 (버전 호환)
        let items: RNIap.Product[] = [];
        try {
          // v13+ (object 인자)
          // @ts-ignore
          items = await RNIap.getProducts({ skus: productIds });
        } catch {
          // 구버전 (array 인자)
          // @ts-ignore
          items = await RNIap.getProducts(productIds);
        }
        console.log('📦 상품 목록:', items);
        setProducts(items);

        // 4) 구매 리스너
        purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase) => {
          try {
            if (!purchase || !purchase.transactionId) return;

            // ⚠️ 기간권(일회성): 반드시 소비 처리 → 재구매 가능
            await RNIap.finishTransaction({ purchase, isConsumable: true });

            // 서버 영수증 검증 & 만료일 연장
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_BASE_URL}/api/verify-receipt`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                productId: purchase.productId,
                transactionId: purchase.transactionId,
                receipt: purchase.purchaseToken, // Android purchase token
              }),
            });

            const json = await res.json();
            if (res.ok && json?.success) {
              Alert.alert(
                t.success || 'Success',
                t.purchaseSuccess || 'Premium access activated successfully!',
              );
              await AsyncStorage.setItem('currentUser', JSON.stringify(json.user));
              router.replace('/topics');
            } else {
              Alert.alert(
                t.error || 'Error',
                t.verificationFailed || 'Receipt verification failed.',
              );
            }
          } catch (e) {
            console.warn('검증/정산 처리 중 오류:', e);
            Alert.alert(t.error || 'Error', t.purchaseFailed || 'Payment processing failed.');
          }
        });

        purchaseErrorSub.current = RNIap.purchaseErrorListener((e) => {
          console.warn('구매 에러:', e);
          Alert.alert(t.error || 'Error', e.message || (t.purchaseFailed || 'Payment processing failed.'));
        });
      } catch (e: any) {
        console.error('❌ IAP 초기화 실패:', e);
        setIapAvailable(false);
        const msg =
          e?.message?.includes('E_IAP_NOT_AVAILABLE') || e?.toString?.().includes('E_IAP_NOT_AVAILABLE')
            ? (t.iapNotAvailable ??
              '결제를 테스트하려면 Play 스토어에서 내부 테스트 링크로 설치하고, 테스터 계정으로 로그인해야 합니다.')
            : (t.iapInitFailed || 'Failed to initialize in-app purchases.');
        Alert.alert(t.error || 'Error', msg);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      try { purchaseUpdateSub.current && purchaseUpdateSub.current.remove(); } catch {}
      try { purchaseErrorSub.current && purchaseErrorSub.current.remove(); } catch {}
      RNIap.endConnection();
    };
  }, []);

  const handlePurchase = async (productId: string) => {
    try {
      setIsLoading(true);
      // 최신 RN-IAP는 객체 인자 사용
      // @ts-ignore
      await RNIap.requestPurchase({
        sku: productId,
        andDangerouslyFinishTransactionAutomatically: false, // 리스너에서 finishTransaction
      });
      // 결과 처리는 purchaseUpdatedListener에서 수행
    } catch (err: any) {
      console.warn('구매 실패:', err);
      Alert.alert(t.error || 'Error', err?.message || t.purchaseFailed || 'Payment processing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const showIapUnavailableHint =
    iapAvailable === false || (__DEV__ && (products?.length ?? 0) === 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛒 {t.premiumMembership || 'Premium Membership'}</Text>

      {isDeviceConflict && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t.deviceAlreadyRegistered || 'This device is already registered with another account.'}
          </Text>
          <Text style={styles.warningSubtext}>
            {t.premiumMultipleDevices || 'Upgrade to premium to use on multiple devices.'}
          </Text>
        </View>
      )}

      {showIapUnavailableHint && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t.iapNotAvailable ||
              'Play 스토어 설치본에서만 결제가 가능합니다. 내부 테스트 링크로 설치하고 테스터 계정으로 로그인하세요.'}
          </Text>
        </View>
      )}

      {isLoading ? (
        <Text>{t.loading || 'Loading...'}</Text>
      ) : products.length === 0 ? (
        <Text>{t.noProductsAvailable || 'No products available.'}</Text>
      ) : (
        products.map((p) => (
          <View key={p.productId} style={styles.productCard}>
            <Text style={styles.productTitle}>{p.title}</Text>
            <Text style={styles.productPrice}>{p.localizedPrice}</Text>
            <Text style={styles.productDescription}>
              {getProductDescription(p.productId, t)}
            </Text>
            <Button
              title={t.buyNow || 'Buy Now'}
              onPress={() => handlePurchase(p.productId)}
              disabled={isLoading}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function getProductDescription(productId: string, t: any) {
  switch (productId) {
    case 'monthly_kr':
      return t.monthlyDescription || '1 month premium access';
    case 'semiannual_kr':
      return t.semiannualDescription || '6 months premium access';
    case 'annual_kr':
      return t.annualDescription || '1 year premium access';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FFF3F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#666',
  },
  productCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
});
