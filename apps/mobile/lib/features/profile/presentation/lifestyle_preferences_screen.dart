import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/responsive_card_container.dart';
import '../models/lifestyle_preferences_model.dart';
import '../services/profile_api_service.dart';

class LifestylePreferencesScreen extends StatefulWidget {
  final LifestylePreferencesModel? initialPreferences;

  const LifestylePreferencesScreen({super.key, this.initialPreferences});

  @override
  State<LifestylePreferencesScreen> createState() =>
      _LifestylePreferencesScreenState();
}

class _LifestylePreferencesScreenState
    extends State<LifestylePreferencesScreen> {
  final ProfileApiService _profileService = ProfileApiService();
  late LifestylePreferencesModel _prefs;
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _prefs = widget.initialPreferences ?? LifestylePreferencesModel();
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(top: 18.0, bottom: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.neonYellow),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChipGroup<T>({
    required List<Map<String, dynamic>> options,
    required String selectedValue,
    required ValueChanged<String> onSelected,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final isSelected = opt['value'] == selectedValue;
        return InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => onSelected(opt['value'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.neonYellow : AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppTheme.neonYellow : AppTheme.border,
              ),
            ),
            child: Text(
              opt['label'] as String,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? Colors.black : AppTheme.textSecondary,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Future<void> _handleSave() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final res = await _profileService.updateLifestyle(_prefs.toJson());

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (res.success) {
        _successMessage = 'Preferences saved successfully!';
        if (res.data != null) {
          _prefs = res.data!;
        }
      } else {
        _errorMessage = res.message.isNotEmpty
            ? res.message
            : 'Failed to update preferences';
      }
    });

    if (res.success) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) Navigator.of(context).pop(true);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lifestyle Preferences'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: ResponsiveCardContainer(
            maxWidth: 580,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Set Your Living Habits',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'We match you with compatible flatmates based on your real routines.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
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
                if (_successMessage != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.mint.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.mint),
                    ),
                    child: Text(
                      _successMessage!,
                      style: const TextStyle(color: AppTheme.mint, fontSize: 13),
                    ),
                  ),

                // Sleep Schedule
                _buildSectionTitle('Sleep Schedule', Icons.bedtime),
                _buildChipGroup(
                  options: [
                    {'label': '🌅 Early Bird', 'value': 'EARLY_BIRD'},
                    {'label': '🦉 Night Owl', 'value': 'NIGHT_OWL'},
                    {'label': '⚡ Flexible', 'value': 'FLEXIBLE'},
                  ],
                  selectedValue: _prefs.sleepSchedule,
                  onSelected: (val) =>
                      setState(() => _prefs = _prefs.copyWith(sleepSchedule: val)),
                ),

                // Cleanliness
                _buildSectionTitle('Cleanliness Level', Icons.cleaning_services),
                _buildChipGroup(
                  options: [
                    {'label': '✨ Very Clean', 'value': 'VERY_CLEAN'},
                    {'label': '🧹 Moderate', 'value': 'MODERATE'},
                    {'label': '🛋️ Relaxed', 'value': 'RELAXED'},
                  ],
                  selectedValue: _prefs.cleanliness,
                  onSelected: (val) =>
                      setState(() => _prefs = _prefs.copyWith(cleanliness: val)),
                ),

                // Social Preference
                _buildSectionTitle('Social Environment', Icons.people),
                _buildChipGroup(
                  options: [
                    {'label': '🤫 Introvert', 'value': 'INTROVERT'},
                    {'label': '🎉 Extrovert', 'value': 'EXTROVERT'},
                    {'label': '⚖️ Ambivert', 'value': 'AMBIVERT'},
                    {'label': '🥂 Occasional Guests', 'value': 'OCCASIONAL_GUESTS'},
                  ],
                  selectedValue: _prefs.socialPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(socialPreference: val)),
                ),

                // Food Preference
                _buildSectionTitle('Food & Kitchen', Icons.restaurant),
                _buildChipGroup(
                  options: [
                    {'label': '🥗 Vegetarian', 'value': 'VEGETARIAN'},
                    {'label': '🍗 Non-Vegetarian', 'value': 'NON_VEGETARIAN'},
                    {'label': '🌱 Vegan', 'value': 'VEGAN'},
                    {'label': '🍳 Eggetarian', 'value': 'EGGETARIAN'},
                  ],
                  selectedValue: _prefs.foodPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(foodPreference: val)),
                ),

                // Work Schedule
                _buildSectionTitle('Work / Study Mode', Icons.laptop_mac),
                _buildChipGroup(
                  options: [
                    {'label': '🏠 Work From Home', 'value': 'WORK_FROM_HOME'},
                    {'label': '🏢 Office', 'value': 'OFFICE'},
                    {'label': '🔀 Hybrid', 'value': 'HYBRID'},
                    {'label': '🎓 Student', 'value': 'STUDENT'},
                  ],
                  selectedValue: _prefs.workSchedule,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(workSchedule: val)),
                ),

                // Smoking Preference
                _buildSectionTitle('Smoking', Icons.smoke_free),
                _buildChipGroup(
                  options: [
                    {'label': '🚭 Never', 'value': 'NEVER'},
                    {'label': '🌿 Outside Only', 'value': 'OUTSIDE_ONLY'},
                    {'label': '💨 Occasionally', 'value': 'OCCASIONALLY'},
                    {'label': '🚬 Regular', 'value': 'REGULAR'},
                  ],
                  selectedValue: _prefs.smokingPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(smokingPreference: val)),
                ),

                // Drinking Preference
                _buildSectionTitle('Drinking', Icons.local_bar),
                _buildChipGroup(
                  options: [
                    {'label': '🚫 Never', 'value': 'NEVER'},
                    {'label': '🍺 Occasionally', 'value': 'OCCASIONALLY'},
                    {'label': '🍷 Regular', 'value': 'REGULAR'},
                  ],
                  selectedValue: _prefs.drinkingPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(drinkingPreference: val)),
                ),

                // Pet Preference
                _buildSectionTitle('Pets', Icons.pets),
                _buildChipGroup(
                  options: [
                    {'label': '🐾 Loves Pets', 'value': 'LOVES_PETS'},
                    {'label': '🚫 No Pets', 'value': 'NO_PETS'},
                    {'label': '🐶 Has Pet', 'value': 'HAS_PET'},
                  ],
                  selectedValue: _prefs.petPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(petPreference: val)),
                ),

                // Privacy Preference
                _buildSectionTitle('Privacy Need', Icons.lock_outline),
                _buildChipGroup(
                  options: [
                    {'label': '🔒 High Privacy', 'value': 'HIGH'},
                    {'label': '🔑 Moderate', 'value': 'MODERATE'},
                    {'label': '🚪 Open/Low', 'value': 'LOW'},
                  ],
                  selectedValue: _prefs.privacyPreference,
                  onSelected: (val) => setState(
                      () => _prefs = _prefs.copyWith(privacyPreference: val)),
                ),

                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.neonYellow,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.black,
                            ),
                          )
                        : const Text(
                            'Save Lifestyle Preferences',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

