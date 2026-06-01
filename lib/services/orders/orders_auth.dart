import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../viewmodel/orders_model.dart';

class OrderProvider extends ChangeNotifier {

  bool isLoading = false;

  List<OrderListModel> orders = [];

  String error = '';

  Future<void> getOrders() async {

    isLoading = true;
    notifyListeners();

    try {

      final prefs = await SharedPreferences.getInstance();

      final token = prefs.getString("token") ?? "";

      final response = await http.get(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/orders",
        ),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      if (response.statusCode == 200) {

        final data = jsonDecode(response.body);

        orders = (data["orders"] as List)
            .map((e) => OrderListModel.fromJson(e))
            .toList();

      } else {

        error = "Failed to load orders";
      }

    } catch (e) {

      error = e.toString();

    } finally {

      isLoading = false;
      notifyListeners();
    }
  }
}