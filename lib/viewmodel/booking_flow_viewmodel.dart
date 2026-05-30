import 'dart:async';
import 'package:flutter/material.dart';
import '../model/booking_status.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';

class BookingFlowViewModel extends ChangeNotifier {
  BookingStatus _status = BookingStatus.idle;
  BookingStatus get status => _status;

  String? _partnerName;
  String? get partnerName => _partnerName;

  String? _partnerDistance;
  String? get partnerDistance => _partnerDistance;

  int? _activeOrderId;
  int? get activeOrderId => _activeOrderId;

  Timer? _pollingTimer;

  BookingStatus _mapStringToStatus(String? statusStr) {
    switch (statusStr) {
      case 'searching':
        return BookingStatus.searching;
      case 'assigned':
        return BookingStatus.assigned;
      case 'accepted':
        return BookingStatus.accepted;
      case 'onTheWay':
        return BookingStatus.onTheWay;
      case 'completed':
        return BookingStatus.completed;
      case 'failed':
        return BookingStatus.failed;
      case 'idle':
      default:
        return BookingStatus.idle;
    }
  }

  String _mapStatusToString(BookingStatus status) {
    switch (status) {
      case BookingStatus.searching:
        return 'searching';
      case BookingStatus.assigned:
        return 'assigned';
      case BookingStatus.accepted:
        return 'accepted';
      case BookingStatus.onTheWay:
        return 'onTheWay';
      case BookingStatus.completed:
        return 'completed';
      case BookingStatus.failed:
        return 'failed';
      case BookingStatus.idle:
      default:
        return 'idle';
    }
  }

  /// BOOKING SEARCH START (with order ID)
  void startSearching([int? orderId]) {
    _activeOrderId = orderId;
    _status = BookingStatus.searching;
    _partnerName = null;
    _partnerDistance = null;
    notifyListeners();

    if (orderId == null || orderId == 0) {
      // Local simulation fallback if offline/no backend
      Future.delayed(const Duration(seconds: 4), () {
        if (_status == BookingStatus.searching && (_activeOrderId == null || _activeOrderId == 0)) {
          _status = BookingStatus.assigned;
          _partnerName = "Ravi Kumar";
          _partnerDistance = "3.2 km away";
          notifyListeners();
        }
      });
    } else {
      _startPolling();
    }
  }

  // Track previous status to detect transitions
  BookingStatus? _prevPolledStatus;

  void _startPolling() {
    _pollingTimer?.cancel();
    _prevPolledStatus = null;
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      if (_activeOrderId == null) {
        timer.cancel();
        return;
      }
      try {
        final res = await ApiService.get('/api/orders/$_activeOrderId/booking-flow');
        if (res['success'] == true) {
          final newStatus = _mapStringToStatus(res['status']);
          _partnerName = res['partnerName'];
          _partnerDistance = res['partnerDistance'];

          if (newStatus != _status) {
            final oldStatus = _status;
            _status = newStatus;
            notifyListeners();

            // 🔔 Fire local notification when partner is first assigned
            if (newStatus == BookingStatus.assigned &&
                oldStatus == BookingStatus.searching) {
              NotificationService().showPartnerAssigned(
                partnerName: _partnerName ?? 'Your Partner',
                serviceName: 'your service',
                distance: _partnerDistance ?? 'Nearby',
              );
            }
          }

          // Stop polling if we reached terminal state
          if (_status == BookingStatus.completed ||
              _status == BookingStatus.failed ||
              _status == BookingStatus.idle) {
            timer.cancel();
          }
        }
      } catch (e) {
        debugPrint("Error polling booking flow: $e");
      }
    });
  }

  /// Update booking status both locally and on backend
  Future<void> updateStatus(BookingStatus newStatus) async {
    _status = newStatus;
    notifyListeners();

    if (_activeOrderId != null && _activeOrderId != 0) {
      try {
        final statusStr = _mapStatusToString(newStatus);
        await ApiService.put('/api/orders/$_activeOrderId/booking-flow', {
          'status': statusStr,
        });
      } catch (e) {
        debugPrint("Failed to update booking status on backend: $e");
      }
    }
  }

  /// PARTNER ASSIGNED (Manual helper if needed)
  void assignPartner({
    required String name,
    required String distance,
  }) {
    _status = BookingStatus.assigned;
    _partnerName = name;
    _partnerDistance = distance;
    notifyListeners();
  }

  /// PARTNER ACCEPTED
  void acceptPartner() {
    updateStatus(BookingStatus.accepted);
  }

  /// ORDER ON THE WAY
  void startOnTheWay() {
    updateStatus(BookingStatus.onTheWay);
  }

  /// BOOKING COMPLETED
  void completeBooking() {
    updateStatus(BookingStatus.completed);
  }

  /// RESET FLOW
  void resetBookingFlow() {
    _pollingTimer?.cancel();
    _activeOrderId = null;
    _status = BookingStatus.idle;
    _partnerName = null;
    _partnerDistance = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}