import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/storage/token_storage.dart';
import '../../../core/widgets/responsive_card_container.dart';
import '../../auth/services/auth_api_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = TokenStorage();
    final user = storage.currentUser;
    final authService = AuthApiService();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Flatmate Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.pink),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: ResponsiveCardContainer(
            maxWidth: 520,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.neonYellow.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person,
                  color: AppTheme.neonYellow,
                  size: 38,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Authenticated Successfully',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                user != null
                    ? (user['email'] ?? user['phoneNumber'] ?? 'Welcome!')
                    : 'Welcome to Flatmate!',
                style: const TextStyle(
                  fontSize: 16,
                  color: AppTheme.mint,
                ),
              ),
              const SizedBox(height: 30),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Column(
                  children: [
                    Text(
                      'Task 03 — Authentication Complete',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.neonYellow,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Ready for Phase 3: User Profiles & Lifestyle Preferences.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

