import 'package:flutter/material.dart';

class CategoryCard extends StatelessWidget {

  final String title;
  final String? image ;

  final VoidCallback? onTap;

  const CategoryCard({super.key, required this.title, this.onTap, this.image});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

        child: Container(
      decoration: BoxDecoration(
        color:Colors.white,
        borderRadius: BorderRadius.circular(12),

        boxShadow: [
          BoxShadow(
            color:Colors.black12,
            blurRadius: 6,
            offset: Offset( 0, 3),
          )
        ]
      ),
      child: Center(
        child: Text(title,textAlign: TextAlign.center,
        style: TextStyle(fontSize: 13,
        fontWeight: FontWeight.w500
        ),
        ),
      ),
      )
    );
  }
}
