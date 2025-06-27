import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../lib/api';

const productIds = ['monthly_subscription_kr']; // 실제 등록한 제품 ID로 변경

export default function PurchaseScreen() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await RNIap.initConnection();
        const items = await RNIap.getProducts({ skus: productIds }); // ✅ 수정됨
        setProducts(items);
      } catch (err) {
        console.warn('❌ IAP Init Error', err);
      }
    };

    init();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  const handlePurchase = async (productId: string) => {
    try {
      const purchase = await RNIap.requestPurchase({ sku: productId }); // ✅ 수정됨

      if (!purchase || Array.isArray(purchase)) {
        throw new Error('유효하지 않은 구매 응답');
      }

      console.log('✅ 구매 완료:', purchase);

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
          receipt: purchase.transactionReceipt || purchase.purchaseToken,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        Alert.alert('🎉 구매 성공', '프리미엄 기능이 활성화되었습니다.');
        await AsyncStorage.setItem('currentUser', JSON.stringify(result.user));
        router.replace('/topics');
      } else {
        Alert.alert('검증 실패', '결제 인증에 실패했습니다.');
      }
    } catch (err) {
      console.warn('❌ 구매 실패:', err);
      Alert.alert('결제 실패', '결제를 완료하지 못했습니다.');
    }
  };

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>💰 프리미엄 결제</Text>

      {products.map((product) => (
        <View key={product.productId} style={{ marginBottom: 20 }}>
          <Text>{product.title}</Text>
          <Text>{product.localizedPrice}</Text>
          <Button title="구매하기" onPress={() => handlePurchase(product.productId)} />
        </View>
      ))}
    </View>
  );
}
