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
        CategoryModel(id: "ac_repair", title: "AcRepair", image: "${ApiService.baseUrl}/assets/categories/ac_repair.png"),
        CategoryModel(id: "car_washing", title: "Car Washing", image: "${ApiService.baseUrl}/assets/categories/car_washing.png"),
        CategoryModel(id: "plumber", title: "Plumber", image: "${ApiService.baseUrl}/assets/categories/plumber.png"),
        CategoryModel(id: "cleaning", title: "Cleaning", image: "${ApiService.baseUrl}/assets/categories/cleaning.png"),
        CategoryModel(id: "electrician", title: "Electrician", image: "${ApiService.baseUrl}/assets/categories/electrician.png"),
        CategoryModel(id: "salon_and_spa", title: "Salon And Spa", image: "${ApiService.baseUrl}/assets/categories/salon_and_spa.png"),
        CategoryModel(id: "painter", title: "Painter", image: "${ApiService.baseUrl}/assets/categories/painter.png"),
        CategoryModel(id: "carpenter", title: "Carpenter", image: "${ApiService.baseUrl}/assets/categories/carpenter.png"),
        CategoryModel(id: "bike_services", title: "Bike Services", image: "${ApiService.baseUrl}/assets/categories/bike_services.png"),
        CategoryModel(id: "architecture", title: "Architecture", image: "${ApiService.baseUrl}/assets/categories/architecture.png"),
        CategoryModel(id: "contractor", title: "Contractor", image: "${ApiService.baseUrl}/assets/categories/contractor.png"),
        CategoryModel(id: "mechanic", title: "Mechanic", image: "${ApiService.baseUrl}/assets/categories/mechanic.png"),
        CategoryModel(id: "pandit_ji", title: "Pandit ji", image: "${ApiService.baseUrl}/assets/categories/pandit_ji.png"),
        CategoryModel(id: "driver", title: "Driver", image: "${ApiService.baseUrl}/assets/categories/driver.png"),
        CategoryModel(id: "photographer", title: "Photographer", image: "${ApiService.baseUrl}/assets/categories/photographer.png"),
        CategoryModel(id: "doctors", title: "Doctors", image: "${ApiService.baseUrl}/assets/categories/doctors.png"),
        CategoryModel(id: "compounder", title: "Compounder", image: "${ApiService.baseUrl}/assets/categories/compounder.png"),
        CategoryModel(id: "halwai", title: "Halwai", image: "${ApiService.baseUrl}/assets/categories/halwai.png")
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

  void setDate(DateTime date) {
    selectedDate = date;
    notifyListeners();
  }

  void setSlot(String slot) {
    selectedSlot = slot;
    notifyListeners();
  }
}
