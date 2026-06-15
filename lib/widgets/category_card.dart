import 'package:flutter/material.dart';

import '../utils/app_colors.dart';

class CategoryCard extends StatelessWidget {
  final String title;
  final String? imageUrl;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.title,
    this.onTap,
    this.imageUrl,
  });

  // Map category name to an icon as fallback
  IconData _getFallbackIcon() {
    final lower = title.toLowerCase();
    if (lower.contains('plumb')) return Icons.plumbing;
    if (lower.contains('electric')) return Icons.electrical_services;
    if (lower.contains('clean')) return Icons.cleaning_services;
    if (lower.contains('salon') || lower.contains('spa') || lower.contains('hair')) return Icons.content_cut;
    if (lower.contains('paint')) return Icons.format_paint;
    if (lower.contains('carpen') || lower.contains('wood')) return Icons.handyman;
    if (lower.contains('car') || lower.contains('wash')) return Icons.local_car_wash;
    if (lower.contains('bike') || lower.contains('motor')) return Icons.two_wheeler;
    if (lower.contains('ac') || lower.contains('air')) return Icons.ac_unit;
    if (lower.contains('arch')) return Icons.architecture;
    if (lower.contains('contract')) return Icons.construction;
    if (lower.contains('mechanic')) return Icons.build;
    if (lower.contains('pandit') || lower.contains('puja') || lower.contains('pooja')) return Icons.self_improvement;
    if (lower.contains('driver')) return Icons.drive_eta;
    if (lower.contains('photo')) return Icons.camera_alt;
    if (lower.contains('doctor') || lower.contains('doc')) return Icons.medical_services;
    if (lower.contains('compound') || lower.contains('nurse')) return Icons.local_hospital;
    if (lower.contains('halwai') || lower.contains('catering') || lower.contains('cater')) return Icons.restaurant;
    if (lower.contains('advocate') || lower.contains('lawyer')) return Icons.gavel;
    if (lower.contains('interior')) return Icons.chair;
    return Icons.home_repair_service;
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // TOP CARD
            Container(
              height: 68,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Center(
                child: imageUrl != null && imageUrl!.isNotEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(5),
                        child: Image.network(
                          imageUrl!,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            // If image fails to load, show a colored icon
                            return Icon(
                              _getFallbackIcon(),
                              size: 34,
                              color: AppColors.primaryButton,
                            );
                          },
                          loadingBuilder: (context, child, progress) {
                            if (progress == null) return child;
                            return Icon(
                              _getFallbackIcon(),
                              size: 34,
                              color: AppColors.primaryButton.withOpacity(0.4),
                            );
                          },
                        ),
                      )
                    : Icon(
                        _getFallbackIcon(),
                        size: 34,
                        color: AppColors.primaryButton,
                      ),
              ),
            ),

            const SizedBox(height: 6),

            // TITLE BELOW CARD
            Center(
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}