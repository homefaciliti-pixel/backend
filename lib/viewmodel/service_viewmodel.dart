import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../model/service_model.dart';

class ServiceViewModel extends ChangeNotifier {



  String _searchQuery =  "";
  void setSearchQuery( String value){
    _searchQuery =value.toLowerCase();
    notifyListeners();


    /// Future API call
    /// yha API lgegi (search services from backend)
  }

                 /// DATA MAP



  final Map<String, List<ServiceModel>> _allServices = {

    "Plumber": [
      ServiceModel(
        title: "Tap Repair",
        image: null,
        price: 299,
        description: "Fix leaking taps and water issues",
      ),
      ServiceModel(
        title: "Pipe Fix",
        image: null,
        price: 499,
        description: "Repair damaged pipes",
      ),
      ServiceModel(
        title: "Leakage Repair",
        image: null,
        price: 399,
        description: "Solve leakage problems",
      ),
    ],

    "Electrician": [
      ServiceModel(
        title: "Fan Repair",
        image: null,
        price: 199,
        description: "Fix fan issues",
      ),
      ServiceModel(
        title: "Switch Repair",
        image: null,
        price: 149,
        description: "Repair switches and boards",
      ),
      ServiceModel(
        title: "Wiring Work",
        image: null,
        price: 799,


        description: "Complete wiring setup",
      ),
    ],

    "Cleaning Services": [
      ServiceModel(
        title: "Home Cleaning",
        image: null,
        price: 999,
        description: "Full house cleaning service",
      ),
      ServiceModel(
        title: "Bathroom Cleaning",
        image: null,
        price: 499,
        description: "Deep bathroom cleaning",
      ),
    ],

    "AcRepair":[
      ServiceModel(title:"Ac Service", price:500, description:"all clean ")
    ],
    "Salon And Spa": [
      ServiceModel(title: "Hair Cut", image: null, price: 299, description: "Salon service"),
    ],
    "Painter": [
      ServiceModel(title: "Wall Paint", image: null, price: 1999, description: "Painting"),
    ],

    "Carpenter": [
      ServiceModel(title: "Furniture Repair", image: null, price: 499, description: "Wood work"),
    ],
    "Bike Services":[
      ServiceModel(title:"Bike" , price:700,image: null, description:"service bike")
    ]


  };

  List<ServiceModel> _services = [];

  List<ServiceModel> get services => _services;

  /// LOAD DATA
  void loadServices(String categoryName) {
    _services = _allServices[categoryName] ?? [];
    notifyListeners();
  }

  /// SERVICE DETAIL
  ServiceModel? selectedService;

  void selectService(ServiceModel service) {
    selectedService = service;
    notifyListeners();
  }

               ///Date and Time select

  DateTime? selectedDate;
  String? selectedSlot;

  void setDtae(DateTime date){
    selectedDate = date;
    notifyListeners();
  }

  void setSlot(String slot){
    selectedSlot = slot;
    notifyListeners();
  }

           //trending service viewmodel

  List<ServiceModel>get trendingServices{
    return _allServices.values.expand((list)=>list).
    take(5).toList();
  }
   /// categories

  List<String> get categories{
    return _allServices.keys.toList();
  }
              //search  service




  List<ServiceModel>get allServices{
    return _allServices.values.expand((list) => list).toList();
  }

  List<ServiceModel> get filteredAllServices{
    if(_searchQuery.isEmpty)return[];
    return allServices.where((service){
      return service.title.toLowerCase().contains(_searchQuery);
    }).toList();

    // Future Api Response
    // yaha backend se data aayega
  }


}
