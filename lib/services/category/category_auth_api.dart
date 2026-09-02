import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/category_viewmodel.dart';

class CategoryViewmodelApi extends ChangeNotifier {
  List<CategoryModel> _categories = [];

  List<CategoryModel> get categories => _categories;

  bool _categoryLoading = false;
  bool get categoryLoading => _categoryLoading;

  // Fallback categories with live dynamic image URLs (used when network fails)
  static const List<Map<String, String>> _fallbackCategories = [
    {"id": "1", "name": "Plumber", "image": "https://backend-1-ux3b.onrender.com/uploads/1786436206314-361864978.png"},
    {"id": "3", "name": "Electrician", "image": "https://backend-1-ux3b.onrender.com/uploads/1786436786199-75987165.png"},
    {"id": "5", "name": "Salon", "image": "https://backend-1-ux3b.onrender.com/uploads/1786435950565-776214721.png"},
    {"id": "7", "name": "Cleaning", "image": "https://backend-1-ux3b.onrender.com/uploads/1786435733935-912415731.png"},
    {"id": "9", "name": "Architect", "image": "https://backend-1-ux3b.onrender.com/uploads/1786446437586-807912234.png"},
    {"id": "11", "name": "Carpenter", "image": "https://backend-1-ux3b.onrender.com/uploads/1786446696715-463108420.png"},
    {"id": "27", "name": "Car Washing", "image": "https://backend-1-ux3b.onrender.com/uploads/1786447188981-343393676.png"},
    {"id": "29", "name": "Mechanic", "image": "https://backend-1-ux3b.onrender.com/uploads/1786447506154-356684980.png"},
    {"id": "37", "name": "Spa", "image": "https://backend-1-ux3b.onrender.com/uploads/1786442488680-83135788.png"},
    {"id": "38", "name": "AC Repair", "image": "https://backend-1-ux3b.onrender.com/uploads/1786443552623-508947240.png"},
    {"id": "39", "name": "Advocate", "image": "https://backend-1-ux3b.onrender.com/uploads/1786443775719-379730475.png"},
    {"id": "40", "name": "Compounder", "image": "https://backend-1-ux3b.onrender.com/uploads/1786444894705-730346514.png"},
    {"id": "41", "name": "Cater's", "image": "https://backend-1-ux3b.onrender.com/uploads/1786448684632-62474491.png"},
    {"id": "42", "name": "Driver", "image": "https://backend-1-ux3b.onrender.com/uploads/1786449239057-53965491.png"},
    {"id": "43", "name": "Doctor", "image": "https://backend-1-ux3b.onrender.com/uploads/1786449409020-562460012.png"},
    {"id": "45", "name": "Interior Design", "image": "https://backend-1-ux3b.onrender.com/uploads/1786450010056-25256815.png"},
    {"id": "46", "name": "Pest Control", "image": "https://backend-1-ux3b.onrender.com/uploads/1786450312316-208090036.png"},
    {"id": "48", "name": "Photographer", "image": "https://backend-1-ux3b.onrender.com/uploads/1786450771532-250894362.png"},
    {"id": "49", "name": "Painter", "image": "https://backend-1-ux3b.onrender.com/uploads/1786451019343-476234084.png"},
    {"id": "50", "name": "Repairing", "image": "https://backend-1-ux3b.onrender.com/uploads/1786451422502-681500744.png"},
    {"id": "51", "name": "Solar", "image": "https://backend-1-ux3b.onrender.com/uploads/1786451601583-594352402.png"},
    {"id": "52", "name": "Tax Consultancy", "image": "https://backend-1-ux3b.onrender.com/uploads/1786451938166-658350303.png"},
    {"id": "57", "name": "Contractor", "image": "https://backend-1-ux3b.onrender.com/uploads/1786452243309-608248433.png"},
    {"id": "58", "name": "Pandit Ji", "image": "https://backend-1-ux3b.onrender.com/uploads/1786452463146-744317717.png"},
    {"id": "60", "name": "Iron Works", "image": "https://backend-1-ux3b.onrender.com/uploads/1786452895272-312153747.png"}
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