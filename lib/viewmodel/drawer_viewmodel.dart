import 'package:flutter/material.dart';
import 'package:userapp/model/drawer_item_model.dart';
import 'package:userapp/utils/app_icons.dart';

class DrawerViewmodel extends ChangeNotifier {

  final List<DrawerItemModel> _items = [

    DrawerItemModel(
      title: "Home",
      icon: AppIcons.Home_outlineed,
      route: "/main",
    ),

    DrawerItemModel(
      title: "Privacy Policy",
      icon: AppIcons.privacy,
      route: "/privacy",
    ),

    DrawerItemModel(
      title: "About Us",
      icon: AppIcons.infoicon,
      route: "/about",
    ),

    DrawerItemModel(
      title: "Terms of Use",
      icon: AppIcons.descriptionicon,
      route: "/terms",
    ),

    DrawerItemModel(
      title: "Refund and Cancellation",
      icon: AppIcons.refundcancellation,
      route: "/refund",
    ),

    DrawerItemModel(
      title: "Logout",
      icon: AppIcons.logout,
      route: "/logout", // special route for logout handling
    ),

  ];

  List<DrawerItemModel> get items => _items;
}