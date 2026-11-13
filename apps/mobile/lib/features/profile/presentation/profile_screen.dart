import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/responsive_card_container.dart';
import '../models/profile_model.dart';
import '../services/profile_api_service.dart';
import 'edit_profile_screen.dart';
import 'lifestyle_preferences_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ProfileApiService _profileService = ProfileApiService();
  UserProfileModel? _profile;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _profileService.getMyProfile();

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (res.success) {
        _profile = res.data;
      } else {
        _errorMessage = res.message;
      }
    });
  }

  Widget _buildChip(String label, {Color color = AppTheme.surface}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProfile,
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.neonYellow),
              )
            : SingleChildScrollView(
                child: ResponsiveCardContainer(
                  maxWidth: 620,
                  child: _profile == null
                      ? _buildEmptyState()
                      : _buildProfileContent(),
                ),
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppTheme.neonYellow.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.person_add_alt_1,
            color: AppTheme.neonYellow,
            size: 40,
          ),
        ),
        const SizedBox(height: 20),
        if (_errorMessage != null)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.pink.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.pink),
            ),
            child: Text(
              _errorMessage!,
              style: const TextStyle(color: AppTheme.pink, fontSize: 13),
            ),
          ),
        const Text(
          'No Profile Yet',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Create your profile to start finding compatible flatmates and sharing expenses.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () async {
            final updated = await Navigator.of(context).push<bool>(
              MaterialPageRoute(
                builder: (_) => const EditProfileScreen(),
              ),
            );
            if (updated == true) _loadProfile();
          },
          icon: const Icon(Icons.add, color: Colors.black),
          label: const Text(
            'Create My Profile',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.neonYellow,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileContent() {
    final p = _profile!;
    final lifestyle = p.lifestyle;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Profile Header Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: AppTheme.neonYellow.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.neonYellow, width: 2),
                ),
                child: Center(
                  child: Text(
                    p.displayName.isNotEmpty
                        ? p.displayName[0].toUpperCase()
                        : 'U',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.neonYellow,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${p.displayName}, ${p.age}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${p.gender} • ${p.occupation ?? "Flatmate Seeker"}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on,
                            size: 14, color: AppTheme.mint),
                        const SizedBox(width: 4),
                        Text(
                          p.preferredLocality != null
                              ? '${p.preferredLocality}, ${p.city}'
                              : p.city,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.mint,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Completeness Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: p.isComplete
                ? AppTheme.mint.withValues(alpha: 0.12)
                : AppTheme.pink.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: p.isComplete ? AppTheme.mint : AppTheme.pink,
            ),
          ),
          child: Row(
            children: [
              Icon(
                p.isComplete ? Icons.check_circle : Icons.info_outline,
                color: p.isComplete ? AppTheme.mint : AppTheme.pink,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  p.isComplete
                      ? 'Profile 100% Complete — Discoverable for Matching'
                      : 'Profile Incomplete — Add lifestyle preferences to match',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: p.isComplete ? AppTheme.mint : AppTheme.pink,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Monthly Budget Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Target Budget',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '₹${p.budgetMin} – ₹${p.budgetMax} / month',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.neonYellow,
                ),
              ),
            ],
          ),
        ),

        if (p.bio != null && p.bio!.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'About Me',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  p.bio!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 16),

        // Lifestyle Preferences Section
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Lifestyle & Routines',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      final updated = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(
                          builder: (_) => LifestylePreferencesScreen(
                            initialPreferences: p.lifestyle,
                          ),
                        ),
                      );
                      if (updated == true) _loadProfile();
                    },
                    icon: const Icon(Icons.edit, size: 14, color: AppTheme.neonYellow),
                    label: const Text(
                      'Edit Habits',
                      style: TextStyle(color: AppTheme.neonYellow, fontSize: 13),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (lifestyle != null)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildChip('Schedule: ${lifestyle.sleepSchedule}'),
                    _buildChip('Cleanliness: ${lifestyle.cleanliness}'),
                    _buildChip('Social: ${lifestyle.socialPreference}'),
                    _buildChip('Food: ${lifestyle.foodPreference}'),
                    _buildChip('Work: ${lifestyle.workSchedule}'),
                    _buildChip('Smoking: ${lifestyle.smokingPreference}'),
                    _buildChip('Drinking: ${lifestyle.drinkingPreference}'),
                    _buildChip('Pets: ${lifestyle.petPreference}'),
                    _buildChip('Privacy: ${lifestyle.privacyPreference}'),
                  ],
                )
              else
                const Text(
                  'No lifestyle preferences added yet. Tap Edit Habits to customize.',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Edit Profile Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton.icon(
            onPressed: () async {
              final updated = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => EditProfileScreen(initialProfile: p),
                ),
              );
              if (updated == true) _loadProfile();
            },
            icon: const Icon(Icons.edit, color: AppTheme.neonYellow),
            label: const Text(
              'Edit Profile Details',
              style: TextStyle(
                color: AppTheme.neonYellow,
                fontWeight: FontWeight.bold,
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.neonYellow),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),
      ],
    );
  }
}
