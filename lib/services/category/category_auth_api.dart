import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/category_viewmodel.dart';

class CategoryViewmodelApi extends ChangeNotifier {
  List<CategoryModel> _categories = [];

  List<CategoryModel> get categories => _categories;

  bool _categoryLoading = false;
  bool get categoryLoading => _categoryLoading;

  // Hardcoded fallback categories (used when API fails)
  static const List<Map<String, String>> _fallbackCategories = [
    {"id": "ac_repair",    "name": "AC Repair",    "image": ""},
    {"id": "plumber",      "name": "Plumber",       "image": ""},
    {"id": "electrician",  "name": "Electrician",   "image": ""},
    {"id": "cleaning",     "name": "Cleaning",      "image": ""},
    {"id": "salon_and_spa","name": "Salon & Spa",   "image": ""},
    {"id": "painter",      "name": "Painter",       "image": ""},
    {"id": "carpenter",    "name": "Carpenter",     "image": ""},
    {"id": "car_washing",  "name": "Car Washing",   "image": ""},
    {"id": "bike_services","name": "Bike Services", "image": ""},
    {"id": "mechanic",     "name": "Mechanic",      "image": ""},
    {"id": "architecture", "name": "Architecture",  "image": ""},
    {"id": "driver",       "name": "Driver",        "image": ""},
    {"id": "photographer", "name": "Photographer",  "image": ""},
    {"id": "doctors",      "name": "Doctors",       "image": ""},
    {"id": "compounder",   "name": "Compounder",    "image": ""},
    {"id": "pandit_ji",    "name": "Pandit Ji",     "image": ""},
    {"id": "halwai",       "name": "Halwai",        "image": ""},
    {"id": "contractor",   "name": "Contractor",    "image": ""},
  ];

  Future<void> fetchCategories() async {
    _categoryLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse(
          'https://backend-1-ux3b.onrender.com/api/categories',
        ),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        final List<CategoryModel> fetched = (data["categories"] as List)
            .map((e) => CategoryModel.fromJson(e))
            .toList();

        if (fetched.isNotEmpty) {
          _categories = fetched;
        } else {
          _loadFallback();
        }
      } else {
        _loadFallback();
      }
    } catch (e) {
      print("CATEGORY ERROR => $e");
      _loadFallback();
    } finally {
      _categoryLoading = false;
      notifyListeners();
    }
  }

  void _loadFallback() {
    _categories = _fallbackCategories
        .map((e) => CategoryModel(
              id: e["id"]!,
              name: e["name"]!,
              image: e["image"]!,
            ))
        .toList();
  }
}