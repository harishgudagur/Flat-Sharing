import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/profile/models/lifestyle_preferences_model.dart';
import 'package:mobile/features/profile/models/profile_model.dart';
import 'package:mobile/features/profile/presentation/edit_profile_screen.dart';
import 'package:mobile/features/profile/presentation/lifestyle_preferences_screen.dart';

void main() {
  testWidgets('EditProfileScreen renders all core profile fields and buttons',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const EditProfileScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Profile Details'), findsOneWidget);
    expect(find.text('Full Name *'), findsOneWidget);
    expect(find.text('Date of Birth *'), findsOneWidget);
    expect(find.text('Gender *'), findsOneWidget);
    expect(find.text('City *'), findsOneWidget);
    expect(find.text('Min Budget (₹) *'), findsOneWidget);
    expect(find.text('Max Budget (₹) *'), findsOneWidget);
    expect(find.text('Save Profile'), findsOneWidget);
  });

  testWidgets(
      'LifestylePreferencesScreen renders habit categories and chip selectors',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const LifestylePreferencesScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Set Your Living Habits'), findsOneWidget);
    expect(find.text('Sleep Schedule'), findsOneWidget);
    expect(find.text('Cleanliness Level'), findsOneWidget);
    expect(find.text('Social Environment'), findsOneWidget);
    expect(find.text('Food & Kitchen'), findsOneWidget);
    expect(find.text('Work / Study Mode'), findsOneWidget);

    // Verify chips
    expect(find.text('🌅 Early Bird'), findsOneWidget);
    expect(find.text('🦉 Night Owl'), findsOneWidget);
    expect(find.text('✨ Very Clean'), findsOneWidget);
    expect(find.text('Save Lifestyle Preferences'), findsOneWidget);
  });

  testWidgets(
      'EditProfileScreen pre-fills data when existing profile is provided',
      (WidgetTester tester) async {
    final existingProfile = UserProfileModel(
      id: 'prof-test-1',
      userId: 'user-test-1',
      displayName: 'Samarth',
      dateOfBirth: DateTime(1996, 5, 20),
      gender: 'MALE',
      budgetMin: 12000,
      budgetMax: 18000,
      city: 'Bengaluru',
      preferredLocality: 'HSR Layout',
      occupation: 'Software Engineer',
      isComplete: true,
      lifestyle: LifestylePreferencesModel(sleepSchedule: 'EARLY_BIRD'),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: EditProfileScreen(initialProfile: existingProfile),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Samarth'), findsOneWidget);
    expect(find.text('Bengaluru'), findsOneWidget);
    expect(find.text('HSR Layout'), findsOneWidget);
    expect(find.text('Software Engineer'), findsOneWidget);
  });
}
