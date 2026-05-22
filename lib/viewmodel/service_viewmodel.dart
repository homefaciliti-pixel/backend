import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../model/service_model.dart';
import '../services/api_service.dart';

class ServiceViewModel extends ChangeNotifier {
  ServiceViewModel() {
    // Preload categories and trending services on creation
    loadCategories();
    loadTrendingServices();
  }

  String _searchQuery = "";
  List<String> _categories = [];
  List<ServiceModel> _services = [];
  List<ServiceModel> _trendingServices = [];
  List<ServiceModel> _filteredAllServices = [];

  List<String> get categories => _categories;
  List<ServiceModel> get services => _services;
  List<ServiceModel> get trendingServices => _trendingServices;
  List<ServiceModel> get filteredAllServices => _filteredAllServices;

  ServiceModel? selectedService;
  DateTime? selectedDate;
  String? selectedSlot;

  /// Load Categories
  Future<void> loadCategories() async {
    try {
      final res = await ApiService.get('/api/categories');
      if (res['success'] == true) {
        _categories = List<String>.from(res['categories']);
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to load categories: $e");
      // Fallback local list
      _categories = [
        "Plumber", "Electrician", "Cleaning Services", "AcRepair",
        "Salon And Spa", "Painter", "Carpenter", "Bike Services",
        "Architecture", "Car Washing", "Contractor", "Mechanic",
        "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halbai"
      ];
      notifyListeners();
    }
  }

  /// Load Services for a Category
  Future<void> loadServices(String categoryName) async {
    try {
      final res = await ApiService.get('/api/services?category=${Uri.encodeComponent(categoryName)}');
      if (res['success'] == true) {
        final list = res['services'] as List;
        _services = list.map((item) => ServiceModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to load services for category $categoryName: $e");
      _services = [];
      notifyListeners();
    }
  }

  /// Load Trending Services
  Future<void> loadTrendingServices() async {
    try {
      final res = await ApiService.get('/api/services/trending');
      if (res['success'] == true) {
        final list = res['services'] as List;
        _trendingServices = list.map((item) => ServiceModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to load trending services: $e");
      _trendingServices = [];
      notifyListeners();
    }
  }

  /// Set Search Query and fetch searched services
  Future<void> setSearchQuery(String value) async {
    _searchQuery = value.trim();
    if (_searchQuery.isEmpty) {
      _filteredAllServices = [];
      notifyListeners();
      return;
    }

    try {
      final res = await ApiService.get('/api/services?search=${Uri.encodeComponent(_searchQuery)}');
      if (res['success'] == true) {
        final list = res['services'] as List;
        _filteredAllServices = list.map((item) => ServiceModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Search API failed: $e");
      _filteredAllServices = [];
      notifyListeners();
    }
  }

  void selectService(ServiceModel service) {
    selectedService = service;
    notifyListeners();
  }

  void setDtae(DateTime date) {
    selectedDate = date;
    notifyListeners();
  }

  void setSlot(String slot) {
    selectedSlot = slot;
    notifyListeners();
  }
}
