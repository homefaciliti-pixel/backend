import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../model/categorymodel.dart';
import '../model/service_model.dart';
import '../model/banner_model.dart';
import '../services/api_service.dart';

class ServiceViewModel extends ChangeNotifier {
  ServiceViewModel() {
    // Preload categories and trending services on creation
    loadCategories();
    loadTrendingServices();
    loadBanners();
  }

  String _searchQuery = "";
  List<CategoryModel> _categories = [];
  List<ServiceModel> _services = [];
  List<ServiceModel> _trendingServices = [];
  List<ServiceModel> _filteredAllServices = [];
  List<BannerModel> _banners = [];

  List<CategoryModel> get categories => _categories;
  List<ServiceModel> get services => _services;
  List<ServiceModel> get trendingServices => _trendingServices;
  List<ServiceModel> get filteredAllServices => _filteredAllServices;
  List<BannerModel> get banners => _banners;

  ServiceModel? selectedService;
  DateTime? selectedDate;
  String? selectedSlot;

  /// Load Categories
  Future<void> loadCategories() async {
    try {
      final res = await ApiService.get('/api/categories');
      if (res['success'] == true) {
        final list = res['categories'] as List;
        _categories = list.map((item) => CategoryModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to load categories: $e");
      // Fallback local list
      _categories = [
        CategoryModel(id: "plumber", title: "Plumber", image: ""),
        CategoryModel(id: "electrician", title: "Electrician", image: ""),
        CategoryModel(id: "cleaning", title: "Cleaning", image: ""),
        CategoryModel(id: "ac_repair", title: "AcRepair", image: ""),
        CategoryModel(id: "salon_and_spa", title: "Salon And Spa", image: ""),
        CategoryModel(id: "painter", title: "Painter", image: ""),
        CategoryModel(id: "carpenter", title: "Carpenter", image: ""),
        CategoryModel(id: "bike_services", title: "Bike Services", image: ""),
        CategoryModel(id: "architecture", title: "Architecture", image: ""),
        CategoryModel(id: "car_washing", title: "Car Washing", image: ""),
        CategoryModel(id: "contractor", title: "Contractor", image: ""),
        CategoryModel(id: "mechanic", title: "Mechanic", image: ""),
        CategoryModel(id: "pandit_ji", title: "Pandit ji", image: ""),
        CategoryModel(id: "driver", title: "Driver", image: ""),
        CategoryModel(id: "photographer", title: "Photographer", image: ""),
        CategoryModel(id: "doctors", title: "Doctors", image: ""),
        CategoryModel(id: "compounder", title: "Compounder", image: ""),
        CategoryModel(id: "halbai", title: "Halbai", image: "")
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

  /// Load Banners
  Future<void> loadBanners() async {
    try {
      final res = await ApiService.get('/api/banners');
      if (res['success'] == true) {
        final list = res['banners'] as List;
        _banners = list.map((item) => BannerModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Failed to load banners: $e");
      _banners = [];
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
