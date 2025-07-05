import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../lib/api';

const productIds = ['monthly_kr', 'semiannual_kr', 'annual_kr']; // 실제 등록한 상품 ID

export default function PurchaseScreen() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const connected = await RNIap.initConnection();
        console.log('✅ IAP 연결 성공:', connected);
        const items = await RNIap.getProducts({ skus: productIds });
        console.log('📦 상품 목록:', items);
        setProducts(items);
      } catch (e) {
        console.error('❌ IAP 초기화 실패:', e);
      }
    };
    init();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  const handlePurchase = async (productId: string) => {
    try {
      const purchase = await RNIap.requestPurchase({ sku: productId });
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

      const result = await res.json();
      if (res.ok && result.success) {
        Alert.alert('✅ 구매 성공', '프리미엄 권한이 적용되었습니다.');
        await AsyncStorage.setItem('currentUser', JSON.stringify(result.user));
        router.replace('/topics');
      } else {
        Alert.alert('❌ 인증 실패', '영수증 검증에 실패했습니다.');
      }
    } catch (err) {
      console.warn('구매 실패:', err);
      Alert.alert('오류', '결제 처리 중 문제가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={{ padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>🛒 프리미엄 이용권</Text>
        {products.length === 0 ? (
        <Text>상품을 불러오는 중이거나 등록된 상품이 없습니다.</Text>
      ) : (
        products.map((p) => (
          <View key={p.productId} style={{ marginBottom: 20 }}>
            <Text>{p.title}</Text>
            <Text>{p.localizedPrice}</Text>
            <Button title="구매하기" onPress={() => handlePurchase(p.productId)} />
          </View>
        ))
      )}
    </ScrollView>
  );
}
