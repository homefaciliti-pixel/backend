import 'package:flutter/material.dart';
import '../model/order_model.dart';
import '../services/api_service.dart';

class OrderViewmodel extends ChangeNotifier {
  List<OrderModel> _orders = [];
  List<OrderModel> get orders => _orders;

  /// Fetch orders from backend
  Future<void> fetchOrders() async {
    try {
      final res = await ApiService.get('/api/orders');
      if (res['success'] == true) {
        final list = res['orders'] as List;
        _orders = list.map((item) => OrderModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to fetch orders: $e");
    }
  }

  /// Add order (booking time pr call hoga)
  Future<int?> addOrder(OrderModel order) async {
    try {
      final res = await ApiService.post('/api/orders', {
        'serviceName': order.serviceName,
        'price': order.price,
        'date': order.date,
        'productId': order.productId,
        'description': order.description,
        'timeSlot': order.timeSlot,
      });

      if (res['success'] == true) {
        final newOrder = OrderModel.fromJson(res['order']);
        _orders.insert(0, newOrder);
        notifyListeners();
        return newOrder.id;
      }
    } catch (e) {
      debugPrint("Failed to place order: $e");
    }

    // Local fallback if offline
    _orders.insert(0, order);
    notifyListeners();
    return null;
  }

  /// Cancel order
  Future<void> cancelOrder(int index) async {
    final order = _orders[index];
    if (order.id != null) {
      try {
        final res = await ApiService.put('/api/orders/${order.id}/cancel', {});
        if (res['success'] == true) {
          _orders[index] = OrderModel.fromJson(res['order']);
          notifyListeners();
          return;
        }
      } catch (e) {
        debugPrint("Failed to cancel order on backend: $e");
      }
    }

    // Local fallback
    _orders[index] = OrderModel(
      id: order.id,
      serviceName: order.serviceName,
      price: order.price,
      date: order.date,
      status: "Cancelled",
    );
    notifyListeners();
  }
}