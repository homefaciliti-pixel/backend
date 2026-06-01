import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/category_viewmodel.dart';

//import '../../model/categorymodel.dart';

class CategoryViewmodelApi extends ChangeNotifier {
  List<CategoryModel> _categories = [];

  List<CategoryModel> get categories => _categories;

  bool _categoryLoading = false;
  bool get categoryLoading => _categoryLoading;
  Future<void> fetchCategories() async {
    _categoryLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse(
          'https://backend-1-ux3b.onrender.com/api/categories',
         // 'https://backend-8onr.onrender.com/api/categories',
        ),
      );

      final data = jsonDecode(response.body);

      //print("CATEGORY RESPONSE => $data");

      if (response.statusCode == 200 &&
          data["success"] == true) {
        _categories = (data["categories"] as List)
            .map((e) => CategoryModel.fromJson(e))
            .toList();
      }
    } catch (e) {
      print("CATEGORY ERROR => $e");
    } finally {
      _categoryLoading = false;
      notifyListeners();
    }
  }
}