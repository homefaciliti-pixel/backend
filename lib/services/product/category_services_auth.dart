import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/category_service_model.dart';

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
    services = [];
    notifyListeners();

    final cleanCat = category.trim();

    try {
      final encodedCategory = Uri.encodeComponent(cleanCat);
      final url = Uri.parse(
        "https://backend-1-ux3b.onrender.com/api/categories/$encodedCategory/services",
      );

      final response = await http.get(url).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        List rawList = [];
        if (data is Map<String, dynamic> && data['services'] is List) {
          rawList = data['services'] as List;
        } else if (data is Map<String, dynamic> && data['data'] is List) {
          rawList = data['data'] as List;
        } else if (data is List) {
          rawList = data;
        }

        services = rawList
            .map((e) => CategoryServiceModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
    } catch (e) {
      debugPrint("Error loading services for category '$cleanCat': $e");
    }

    // Fallback if backend returned empty list or error occurred
    if (services.isEmpty) {
      services = _getFallbackServices(cleanCat);
    }

    loading = false;
    notifyListeners();
  }

  List<CategoryServiceModel> _getFallbackServices(String category) {
    final norm = category.toLowerCase().replaceAll(RegExp(r'[\s\-_&]'), '');

    if (norm.contains('plumb')) {
      return [
        CategoryServiceModel(
          title: 'Tap Repair',
          price: 299,
          description: 'Fix leaking taps, valves and water outlets',
          image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Pipe Fix',
          price: 499,
          description: 'Repair damaged or leaking water pipes',
          image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    } else if (norm.contains('car') || norm.contains('wash')) {
      return [
        CategoryServiceModel(
          title: 'Exterior Shine',
          price: 399,
          description: 'Full exterior foam wash, pressure spray & tire polish',
          image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Complete Spa',
          price: 899,
          description: 'Interior vacuum, seat shampooing & exterior detail polish',
          image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    } else if (norm.contains('ac') || norm.contains('air')) {
      return [
        CategoryServiceModel(
          title: 'Ac Service',
          price: 599,
          description: 'Deep foam cleaning of filter and condenser coil',
          image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Ac Installation',
          price: 1299,
          description: 'Split or window AC mounting and copper piping setup',
          image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Gas Refill',
          price: 2499,
          description: 'Complete R32 / R410 refrigerant gas top up with leak check',
          image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    } else if (norm.contains('clean')) {
      return [
        CategoryServiceModel(
          title: 'Bathroom Cleaning',
          price: 499,
          description: 'Deep scrubbing, descaling of tiles and sanitization',
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Full Home Deep Cleaning',
          price: 2999,
          description: 'Complete deep cleaning of living room, kitchen, balcony and rooms',
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    } else if (norm.contains('electric')) {
      return [
        CategoryServiceModel(
          title: 'Fan Repair',
          price: 199,
          description: 'Ceiling or exhaust fan regulator, capacitor & winding repair',
          image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Switch Socket Installation',
          price: 149,
          description: 'Replacement and installation of electrical switches and sockets',
          image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    } else if (norm.contains('salon') || norm.contains('spa')) {
      return [
        CategoryServiceModel(
          title: 'Haircut & Styling',
          price: 299,
          description: 'Professional haircut, head massage and styling',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop',
        ),
        CategoryServiceModel(
          title: 'Face Glow Facial',
          price: 799,
          description: 'Deep cleansing, exfoliation and herbal glow mask',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop',
        ),
      ];
    }

    return [
      CategoryServiceModel(
        title: '$category Inspection',
        price: 199,
        description: 'Complete inspection & diagnostic service by expert technician',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop',
      ),
      CategoryServiceModel(
        title: '$category Full Service',
        price: 499,
        description: 'Standard repair, setup and maintenance package',
        image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop',
      ),
    ];
  }
}