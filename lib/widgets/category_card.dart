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
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 6,
              offset: Offset(0, 3),
            )
          ]
        ),
        child: Padding(
          padding: const EdgeInsets.all(6.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (image != null && image!.isNotEmpty)
                Expanded(
                  child: Image.network(
                    image!,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.category,
                      size: 28,
                      color: Colors.blue,
                    ),
                  ),
                )
              else
                const Expanded(
                  child: Icon(
                    Icons.category,
                    size: 28,
                    color: Colors.blue,
                  ),
                ),
              const SizedBox(height: 6),
              Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
