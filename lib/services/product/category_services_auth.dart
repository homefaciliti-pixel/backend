import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/category_service_model.dart';

//import '../model/service_model.dart';

class CategoryServicesAuth extends ChangeNotifier {
  bool loading = false;
  List<CategoryServiceModel> services = [];

  CategoryServiceModel? selectedService;

  void selectService(CategoryServiceModel service) {
    selectedService = service;
    notifyListeners();
  }

  Future<void> loadServices(String category) async {
    loading = true;
    notifyListeners();

    try {
      final url = Uri.parse(
        "https://backend-1-ux3b.onrender.com/api/categories/$category/services",
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        services = (data['services'] as List)
            .map((e) => CategoryServiceModel.fromJson(e))
            .toList();
      } else {
        services = [];
      }
    } catch (e) {
      services = [];
      debugPrint("Error loading services: $e");
    }

    loading = false;
    notifyListeners();
  }
}