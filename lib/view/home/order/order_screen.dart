import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../model/order_model.dart';
import '../../../services/api_service.dart';
import '../../../viewmodel/order_viewmodel.dart';
import '../../../viewmodel/booking_flow_viewmodel.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/app_icons.dart';

class OrderScreen extends StatefulWidget {
  final OrderModel order;
  const OrderScreen({super.key, required this.order});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  late OrderModel _currentOrder;
  Timer? _pollingTimer;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentOrder = widget.order;
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    if (_currentOrder.id == null) return;
    
    // Do not poll if the status is already completed, cancelled, or failed
    final bStatus = _currentOrder.bookingStatus ?? 'searching';
    if (bStatus == 'completed' || 
        bStatus == 'failed' || 
        bStatus == 'idle' || 
        _currentOrder.status == 'Cancelled' || 
        _currentOrder.status == 'Completed') {
      return;
    }

    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (!mounted) {
        timer.cancel();
        return;
      }
      try {
        final res = await ApiService.get('/api/orders/${_currentOrder.id}/booking-flow');
        if (res['success'] == true && mounted) {
          final String newBookingStatus = res['status'] ?? 'searching';
          final String? partnerName = res['partnerName'];
          final String? partnerDistance = res['partnerDistance'];

          String mainStatus = _currentOrder.status;
          if (newBookingStatus == 'completed') {
            mainStatus = 'Completed';
          }

          setState(() {
            _currentOrder = OrderModel(
              id: _currentOrder.id,
              serviceName: _currentOrder.serviceName,
              price: _currentOrder.price,
              date: _currentOrder.date,
              status: mainStatus,
              bookingStatus: newBookingStatus,
              partnerName: partnerName,
              partnerDistance: partnerDistance,
              productId: _currentOrder.productId,
              description: _currentOrder.description,
              timeSlot: _currentOrder.timeSlot,
            );
          });

          if (newBookingStatus == 'completed' || newBookingStatus == 'failed' || newBookingStatus == 'idle') {
            timer.cancel();
            Provider.of<OrderViewmodel>(context, listen: false).fetchOrders();
          }
        }
      } catch (e) {
        debugPrint("Error polling order status: $e");
      }
    });
  }

  Future<void> _cancelOrder() async {
    if (_currentOrder.id == null) return;
    
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.put('/api/orders/${_currentOrder.id}/cancel', {});
      if (res['success'] == true && mounted) {
        setState(() {
          _currentOrder = OrderModel.fromJson(res['order']);
        });
        _pollingTimer?.cancel();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Booking cancelled successfully")),
        );
        Provider.of<OrderViewmodel>(context, listen: false).fetchOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed to cancel booking: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final minute = dt.minute.toString().padLeft(2, '0');
      final ampm = dt.hour >= 12 ? "PM" : "AM";
      return "${dt.day} ${months[dt.month - 1]} ${dt.year}, $hour:$minute $ampm";
    } catch (_) {
      return dateStr;
    }
  }

  Color _getStatusColor(String bStatus, String status) {
    if (status == 'Cancelled') return Colors.red;
    switch (bStatus) {
      case 'completed':
        return Colors.green;
      case 'assigned':
      case 'accepted':
      case 'onTheWay':
        return AppColors.secondaryBlue;
      case 'searching':
      default:
        return Colors.orange;
    }
  }

  String _getStatusText(String bStatus, String status) {
    if (status == 'Cancelled') return "Cancelled";
    switch (bStatus) {
      case 'completed':
        return "Completed";
      case 'assigned':
        return "Partner Assigned";
      case 'accepted':
        return "Booking Accepted";
      case 'onTheWay':
        return "Partner En Route";
      case 'searching':
        return "Finding Partner";
      case 'idle':
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bStatus = _currentOrder.bookingStatus ?? 'searching';
    final isCancelled = _currentOrder.status == 'Cancelled';
    final isCompleted = _currentOrder.status == 'Completed' || bStatus == 'completed';
    final statusColor = _getStatusColor(bStatus, _currentOrder.status);
    final statusText = _getStatusText(bStatus, _currentOrder.status);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          "Order Details",
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Gradient Header Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isCancelled
                            ? [Colors.red.shade400, Colors.red.shade600]
                            : isCompleted
                                ? [Colors.green.shade400, Colors.green.shade600]
                                : [AppColors.primaryBlue, AppColors.secondaryBlue],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Order #${_currentOrder.id ?? 'N/A'}",
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                statusText.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _currentOrder.serviceName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.access_time, color: Colors.white70, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              _formatDate(_currentOrder.date),
                              style: const TextStyle(
                                color: Colors.white90,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Partner assignment display card
                  if (_currentOrder.partnerName != null && !isCancelled) ...[
                    const Text(
                      "Assigned Service Partner",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: Colors.blue.shade50,
                            child: const Icon(
                              Icons.engineering,
                              size: 32,
                              color: Colors.blueAccent,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _currentOrder.partnerName!,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.star, color: Colors.amber, size: 16),
                                    const SizedBox(width: 4),
                                    Text(
                                      "4.9 (120+ jobs)",
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Icon(Icons.location_on, color: Colors.red.shade400, size: 14),
                                    const SizedBox(width: 2),
                                    Text(
                                      _currentOrder.partnerDistance ?? "Nearby",
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text("Connecting call to ${_currentOrder.partnerName}..."),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                            icon: const Icon(Icons.phone_in_talk, color: Colors.green),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.green.shade50,
                              padding: const EdgeInsets.all(10),
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Visual Stepper Section
                  if (!isCancelled) ...[
                    const Text(
                      "Service Progress",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _buildStepItem(
                            title: "Order Placed",
                            description: "Your service booking request is successfully placed.",
                            isDone: true,
                            isActive: false,
                            isLast: false,
                          ),
                          _buildStepItem(
                            title: "Finding Professional",
                            description: "Connecting with the best professional in your locality.",
                            isDone: bStatus != 'searching' && bStatus != 'idle',
                            isActive: bStatus == 'searching',
                            isLast: false,
                          ),
                          _buildStepItem(
                            title: "Partner Assigned",
                            description: _currentOrder.partnerName != null 
                                ? "Technician ${_currentOrder.partnerName} has been assigned."
                                : "A specialist will be assigned shortly.",
                            isDone: _currentOrder.partnerName != null,
                            isActive: _currentOrder.partnerName != null && bStatus == 'assigned',
                            isLast: false,
                          ),
                          _buildStepItem(
                            title: "Partner En Route",
                            description: "The specialist is traveling to your location.",
                            isDone: bStatus == 'onTheWay' || bStatus == 'completed',
                            isActive: bStatus == 'accepted' || bStatus == 'onTheWay',
                            isLast: false,
                          ),
                          _buildStepItem(
                            title: "Service Completed",
                            description: "Service is fully finished and marked complete.",
                            isDone: bStatus == 'completed',
                            isActive: false,
                            isLast: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Booking Details Card
                  const Text(
                    "Booking Schedule",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailRow("Selected Date", _currentOrder.date.split(' ')[0]),
                        const SizedBox(height: 10),
                        _buildDetailRow("Time Slot", _currentOrder.timeSlot ?? "9 AM - 11 AM"),
                        const SizedBox(height: 10),
                        _buildDetailRow("Product ID", _currentOrder.productId ?? _currentOrder.serviceName),
                        if (_currentOrder.description != null && _currentOrder.description!.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          _buildDetailRow("Description", _currentOrder.description!),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Billing Receipt / Pricing Summary Card
                  const Text(
                    "Payment Details",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _buildReceiptRow("Service Charges", "₹${_currentOrder.price}.00"),
                        const Divider(height: 20),
                        _buildReceiptRow("Safety & Convenience Fee", "₹49.00"),
                        const SizedBox(height: 8),
                        _buildReceiptRow("Discount Promotion", "-₹49.00", isDiscount: true),
                        const Divider(height: 24, thickness: 1.2),
                        _buildReceiptRow(
                          "Total Paid",
                          "₹${_currentOrder.price}.00",
                          isTotal: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),

                  // Map Navigation and Action Buttons
                  if (!isCancelled && !isCompleted && bStatus != 'searching') ...[
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final bookingVM = Provider.of<BookingFlowViewModel>(context, listen: false);
                          bookingVM.startSearching(_currentOrder.id);
                          Navigator.pushNamed(context, "/tracking");
                        },
                        icon: const Icon(Icons.map_outlined),
                        label: const Text(
                          "Track Live Location",
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          foregroundColor: Colors.white,
                          backgroundColor: AppColors.secondaryBlue,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Cancel Button
                  if (!isCancelled && !isCompleted) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text("Cancel Booking"),
                              content: const Text("Are you sure you want to cancel this service booking?"),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text("No, Keep it"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    _cancelOrder();
                                  },
                                  child: const Text(
                                    "Yes, Cancel",
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent, width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          foregroundColor: Colors.redAccent,
                        ),
                        child: const Text(
                          "Cancel Booking",
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],

                  // Back to home button if cancelled or completed
                  if (isCancelled || isCompleted) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pushNamedAndRemoveUntil(context, "/main", (route) => false);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade800,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                        ),
                        child: const Text(
                          "Back to Home",
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _buildStepItem({
    required String title,
    required String description,
    required bool isDone,
    required bool isActive,
    required bool isLast,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? Colors.green
                    : isActive
                        ? AppColors.primaryBlue
                        : Colors.grey.shade300,
                border: isActive
                    ? Border.all(color: Colors.white, width: 2)
                    : null,
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppColors.primaryBlue.withOpacity(0.4),
                          blurRadius: 6,
                          spreadRadius: 2,
                        )
                      ]
                    : null,
              ),
              child: isDone
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : isActive
                      ? const SizedBox(
                          width: 10,
                          height: 10,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isDone ? Colors.green : Colors.grey.shade300,
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isDone
                      ? Colors.black87
                      : isActive
                          ? AppColors.secondaryBlue
                          : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isTotal = false, bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal
                ? Colors.black87
                : isDiscount
                    ? Colors.green
                    : Colors.grey.shade700,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.bold,
            color: isDiscount
                ? Colors.green
                : isTotal
                    ? AppColors.secondaryBlue
                    : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black87,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
