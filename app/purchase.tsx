import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../lib/api';
import { useLanguage } from '../hooks/useLanguage';

const productIds = ['monthly_kr', 'semiannual_kr', 'annual_kr']; // 실제 등록한 상품 ID

export default function PurchaseScreen() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  // 디바이스 중복으로 인한 리다이렉트인지 확인
  const params = useLocalSearchParams();
  const isDeviceConflict = params?.reason === 'device_conflict';

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const connected = await RNIap.initConnection();
        console.log('✅ IAP 연결 성공:', connected);
        const items = await RNIap.getProducts({ skus: productIds });
        console.log('📦 상품 목록:', items);
        setProducts(items);
      } catch (e) {
        console.error('❌ IAP 초기화 실패:', e);
        Alert.alert(t.error || 'Error', t.iapInitFailed || 'Failed to initialize in-app purchases.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  const handlePurchase = async (productId: string) => {
    try {
      setIsLoading(true);
      const result = await RNIap.requestPurchase({ sku: productId });

      const purchase = Array.isArray(result) ? result[0] : result;
      if (!purchase) throw new Error('No purchase returned');

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
          receipt: purchase.purchaseToken,
        }),
      });

      const responseJson = await res.json() as { success: boolean; user?: any };

      if (res.ok && responseJson.success) {
        Alert.alert(
          t.success || 'Success',
          t.purchaseSuccess || 'Premium access activated successfully!'
        );
        await AsyncStorage.setItem('currentUser', JSON.stringify(responseJson.user));
        router.replace('/topics');
      } else {
        Alert.alert(
          t.error || 'Error',
          t.verificationFailed || 'Receipt verification failed.'
        );
      }
    } catch (err) {
      console.warn('구매 실패:', err);
      Alert.alert(t.error || 'Error', t.purchaseFailed || 'Payment processing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛒 {t.premiumMembership || 'Premium Membership'}</Text>

      {isDeviceConflict && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t.deviceAlreadyRegistered || 'This device is already registered with another account.'}</Text>
          <Text style={styles.warningSubtext}>{t.premiumMultipleDevices || 'Upgrade to premium to use on multiple devices.'}</Text>
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
