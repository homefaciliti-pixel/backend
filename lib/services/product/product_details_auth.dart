import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/product_details_model.dart';

class ProductDetailViewModel extends ChangeNotifier {

  bool loading = false;

  ProductDetailModel? product;

  Future<void> loadProductDetail(String serviceTitle) async {

    loading = true;
    notifyListeners();

    try {

      final encodedTitle = Uri.encodeComponent(serviceTitle);

      final url = Uri.parse(
        "https://backend-1-ux3b.onrender.com/api/services/detail/$encodedTitle",
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {

        final data = jsonDecode(response.body);

        product = ProductDetailModel.fromJson(
          data['service'],
        );
      }

    } catch (e) {
      debugPrint("Product Detail Error: $e");
    }

    loading = false;
    notifyListeners();
  }
}