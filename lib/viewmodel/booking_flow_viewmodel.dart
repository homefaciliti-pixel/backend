import 'package:flutter/material.dart';
import '../model/booking_status.dart';

class BookingFlowViewModel extends ChangeNotifier {
  BookingStatus _status = BookingStatus.idle;

  BookingStatus get status => _status;

  String? _partnerName;
  String? get partnerName => _partnerName;

  String? _partnerDistance;
  String? get partnerDistance => _partnerDistance;

  /// BOOKING SEARCH START
  void startSearching() {
    _status = BookingStatus.searching;
    _partnerName = null;
    _partnerDistance = null;
    notifyListeners();

    /// yaha future me backend nearby partner search karega
  }

  /// PARTNER ASSIGNED
  void assignPartner({
    required String name,
    required String distance,
  }) {
    _status = BookingStatus.assigned;
    _partnerName = name;
    _partnerDistance = distance;
    notifyListeners();

    /// yaha future me backend ka response aayega
  }

  /// PARTNER ACCEPTED
  void acceptPartner() {
    _status = BookingStatus.accepted;
    notifyListeners();

    /// yaha future me accept API call hogi
  }

  /// ORDER ON THE WAY
  void startOnTheWay() {
    _status = BookingStatus.onTheWay;
    notifyListeners();
  }

  /// BOOKING COMPLETED
  void completeBooking() {
    _status = BookingStatus.completed;
    notifyListeners();
  }

  /// RESET FLOW
  void resetBookingFlow() {
    _status = BookingStatus.idle;
    _partnerName = null;
    _partnerDistance = null;
    notifyListeners();
  }
}