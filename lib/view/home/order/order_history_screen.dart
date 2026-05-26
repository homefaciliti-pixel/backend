import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../model/order_model.dart';
import '../../../viewmodel/order_viewmodel.dart';
import '../../../utils/app_colors.dart';
import 'order_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      Provider.of<OrderViewmodel>(context, listen: false).fetchOrders();
      _isInit = false;
    }
  }

  Future<void> _refreshOrders() async {
    await Provider.of<OrderViewmodel>(context, listen: false).fetchOrders();
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
        return "Accepted";
      case 'onTheWay':
        return "En Route";
      case 'searching':
        return "Searching...";
      case 'idle':
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<OrderViewmodel>(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          "My Orders",
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshOrders,
        color: AppColors.secondaryBlue,
        child: vm.orders.isEmpty
            ? Center(
                child: ListView(
                  shrinkWrap: true,
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text(
                            "No Orders Yet",
                            style: TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 8),
                          Text(
                            "Swipe down to refresh",
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: vm.orders.length,
                itemBuilder: (context, index) {
                  final order = vm.orders[index];
                  final bStatus = order.bookingStatus ?? 'searching';
                  final statusColor = _getStatusColor(bStatus, order.status);
                  final statusText = _getStatusText(bStatus, order.status);
                  final isPending = order.status == 'Pending';

                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => OrderScreen(order: order),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    order.serviceName,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black87,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    statusText,
                                    style: TextStyle(
                                      color: statusColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Text(
                                  "₹${order.price}",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.secondaryBlue,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text("•", style: TextStyle(color: Colors.grey)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _formatDate(order.date),
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey.shade600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            
                            // Partner info preview if assigned
                            if (order.partnerName != null && order.status != 'Cancelled') ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.engineering, size: 16, color: Colors.grey.shade700),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        "Partner: ${order.partnerName} (${order.partnerDistance ?? 'Nearby'})",
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.grey.shade700,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const Divider(height: 24, thickness: 0.8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Tap to view details & track",
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade500,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                                if (isPending)
                                  TextButton(
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text("Cancel Booking"),
                                          content: const Text("Are you sure you want to cancel this booking?"),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(context),
                                              child: const Text("No"),
                                            ),
                                            TextButton(
                                              onPressed: () {
                                                Navigator.pop(context);
                                                vm.cancelOrder(index);
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
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text(
                                      "Cancel",
                                      style: TextStyle(
                                        color: Colors.redAccent,
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )
                                else
                                  Icon(
                                    Icons.chevron_right,
                                    size: 18,
                                    color: Colors.grey.shade400,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}