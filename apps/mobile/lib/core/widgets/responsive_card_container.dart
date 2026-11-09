import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ResponsiveCardContainer extends StatelessWidget {
  final Widget child;
  final double maxWidth;

  const ResponsiveCardContainer({
    super.key,
    required this.child,
    this.maxWidth = 460,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth > 600;

    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: isDesktop
            ? Container(
                margin: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: AppTheme.border,
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 32,
                      spreadRadius: 4,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: child,
              )
            : Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: child,
              ),
      ),
    );
  }
}

