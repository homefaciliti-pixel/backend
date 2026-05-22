class OrderModel {
  final String serviceName;
  final int price;
  final String date;
  final String status; // Pending /  completed


OrderModel({
    required this.serviceName,
  required this.price,
  required this.date,
  required this.status
});
}