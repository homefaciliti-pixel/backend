import 'package:flutter/material.dart';

import '../model/order_model.dart';

class OrderViewmodel extends ChangeNotifier{
  final List<OrderModel> _orders =[];


  List<OrderModel> get orders => _orders;


                    /// Add order (booking ke time call hoga)
  void addOrder(OrderModel order){
    _orders.insert(0, order);
    notifyListeners();
  }

                   // Cancel order

void cancelOrder(int index){
    _orders[index]= OrderModel(serviceName:_orders[index].serviceName,
        price:_orders[index].price,
        date:_orders[index].date,
        status:"Cancelled");
    notifyListeners();

}


}