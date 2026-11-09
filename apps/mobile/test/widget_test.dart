import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('LoginScreen renders reference card with top pill switcher',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FlatmateApp());
    await tester.pumpAndSettle();

    // Verify top pill switcher
    expect(find.text('Log in'), findsNWidgets(2)); // Pill toggle + Button
    expect(find.text('Create account'), findsOneWidget);

    // Verify headline & subtitle
    expect(find.text('Welcome back'), findsOneWidget);

    // Verify form fields
    expect(find.byType(TextFormField), findsNWidgets(2)); // Identifier + Password
  });

  testWidgets('Switching to Create account tab displays registration fields',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FlatmateApp());
    await tester.pumpAndSettle();

    // Tap 'Create account' pill
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();

    // Verify registration headline and fields
    expect(find.text('Create an account'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(4)); // Email, Phone, Password, Confirm
  });

  testWidgets('Toggling OTP mode adjusts fields for OTP request',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FlatmateApp());
    await tester.pumpAndSettle();

    // Tap 'Log in with OTP code instead'
    await tester.tap(find.text('Log in with OTP code instead'));
    await tester.pumpAndSettle();

    // Button should now be 'Send OTP Code'
    expect(find.text('Send OTP Code'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
  });
}
