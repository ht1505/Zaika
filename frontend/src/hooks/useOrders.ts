import { useState, useCallback } from 'react';
import { ordersApi } from '../lib/api';

export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await ordersApi.myOrders(page);
      setOrders(res.data.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    try {
      const res = await ordersApi.placeOrder(orderData);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to place order';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, error, fetchMyOrders, placeOrder };
}
