import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import '../../../services/orders/orders_auth.dart';

class OrdersListPage extends StatefulWidget {
  const OrdersListPage({super.key});

  @override
  State<OrdersListPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersListPage> {

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      context.read<OrderProvider>().getOrders();
    });
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      appBar: AppBar(
        title: const Text("My Orders"),
      ),

      body: Consumer<OrderProvider>(
        builder: (context, provider, child) {

          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (provider.error.isNotEmpty) {
            return Center(
              child: Text(provider.error),
            );
          }

          if (provider.orders.isEmpty) {
            return const Center(
              child: Text("No Orders Found"),
            );
          }

          return ListView.builder(
            itemCount: provider.orders.length,
            itemBuilder: (context, index) {

              final order = provider.orders[index];

              return Card(
                child: ListTile(
                  title: Text(order.serviceName),
                  subtitle: Text(order.status),
                  trailing: Text(
                    "₹${order.price}",
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}