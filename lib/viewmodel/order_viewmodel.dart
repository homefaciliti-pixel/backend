import 'package:flutter/material.dart';
import '../model/order_model.dart';
import '../model/address_model.dart';
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

  /// Checkout (collects product, address, payment, and user details, and generates order ID)
  /// Returns a Map with 'orderId' (DB ID) and 'razorpayOrderId' (Razorpay ID for payment)
  Future<Map<String, dynamic>?> checkout({
    required OrderModel product,
    required AddressModel address,
    required String paymentMethod,
    required double amountPaid,
    required String userId,
  }) async {
    try {
      final res = await ApiService.post('/api/checkout', {
        'product': {
          'serviceName': product.serviceName,
          'price': product.price,
          'date': product.date,
          'productId': product.productId,
          'description': product.description,
          'timeSlot': product.timeSlot,
        },
        'address': address.toJson(),
        'payment': {
          'paymentMethod': paymentMethod,
          'amountPaid': amountPaid,
        },
        'userId': userId,
      });

      if (res != null && res['success'] == true) {
        final newOrder = OrderModel.fromJson(res['order']);
        _orders.insert(0, newOrder);
        notifyListeners();
        final orderId = res['orderId'] is int ? res['orderId'] : (res['orderId'] as num).toInt();
        final razorpayOrderId = res['razorpayOrderId']?.toString();
        return {
          'orderId': orderId,
          'razorpayOrderId': razorpayOrderId,
        };
      }
    } catch (e) {
      debugPrint("Checkout failed: $e");
    }
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