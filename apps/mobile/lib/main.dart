import 'package:flutter/material.dart';
import 'core/config/env_config.dart';
import 'core/theme/app_theme.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/home/presentation/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.initialize();
  runApp(const FlatmateApp());
}

class FlatmateApp extends StatelessWidget {
  const FlatmateApp({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isAuthenticated = TokenStorage().isAuthenticated;

    return MaterialApp(
      title: 'Flatmate Matching Platform',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: isAuthenticated ? '/home' : '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
