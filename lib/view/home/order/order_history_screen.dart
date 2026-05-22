import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/viewmodel/order_viewmodel.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final vm = Provider.of<OrderViewmodel>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text("My Orders"),
      ),

      body: vm.orders.isEmpty     //  FIX

          ? Center(child: Text("No Orders Yet"))
          : ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: vm.orders.length,
        itemBuilder: (context, index) {

          final order = vm.orders[index];

          return Container(
            margin: EdgeInsets.only(bottom: 12),
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black12, blurRadius: 5)
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                Text(
                  order.serviceName,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                SizedBox(height: 6),

                Text("₹ ${order.price}"),

                SizedBox(height: 6),

                Text("Date: ${order.date}"),

                SizedBox(height: 6),

                Text(
                  "Status: ${order.status}",
                  style: TextStyle(
                    color: order.status == "Completed"
                        ? Colors.green
                        : Colors.orange,
                  ),
                ),
                if (order.status == "Pending")
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        vm.cancelOrder(index);
                      },
                      child: Text(
                        "Cancel",
                        style: TextStyle(color: Colors.red,fontSize:18,fontWeight:FontWeight.bold ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}