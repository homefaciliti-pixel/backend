import 'package:flutter/material.dart';

// Grayscale matrix — converts any image to pure black & white
const List<double> _greyscaleMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0,      0,      0,      1, 0,
];

class CategoryCard extends StatelessWidget {
  final String title;
  final String? image;
  final VoidCallback? onTap;

  const CategoryCard({super.key, required this.title, this.onTap, this.image});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
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
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: image != null && image!.isNotEmpty
                    ? ColorFiltered(
                        colorFilter: const ColorFilter.matrix(_greyscaleMatrix),
                        child: Image.network(
                          image!,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(
                            Icons.category_outlined,
                            size: 28,
                            color: Colors.black54,
                          ),
                        ),
                      )
                    : const Icon(
                        Icons.category_outlined,
                        size: 28,
                        color: Colors.black54,
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
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
