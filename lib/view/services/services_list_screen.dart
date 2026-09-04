import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/product/category_services_auth.dart';
import '../../widgets/service_big_card.dart';
import '../home/servicesdetail screen/services_detail_screen.dart';

class ServicesListScreen extends StatefulWidget {
  final String categoryName;
  const ServicesListScreen({
    super.key,
    required this.categoryName,
  });
  @override
  State<ServicesListScreen> createState() => _ServicesListScreenState();
}

class _ServicesListScreenState extends State<ServicesListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<CategoryServicesAuth>(context, listen: false)
          .loadServices(widget.categoryName);
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<CategoryServicesAuth>(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: Text(
          widget.categoryName.isNotEmpty ? widget.categoryName : 'Services',
          style: const TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
            size: 20,
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: _buildBody(vm),
    );
  }

  Widget _buildBody(CategoryServicesAuth vm) {
    if (vm.loading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Colors.deepPurple,
        ),
      );
    }

    if (vm.services.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.home_repair_service_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              "No services found for ${widget.categoryName}",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                vm.loadServices(widget.categoryName);
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text("Retry"),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vm.services.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.80,
      ),
      itemBuilder: (context, index) {
        final service = vm.services[index];

        return GestureDetector(
          onTap: () {
            vm.selectService(service);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ServiceDetailScreen(
                  serviceTitle: service.title,
                ),
              ),
            );
          },
          child: ServiceBigCard(
            title: service.title,
            price: " ₹${service.price}",
            image: service.image,
          ),
        );
      },
    );
  }
}