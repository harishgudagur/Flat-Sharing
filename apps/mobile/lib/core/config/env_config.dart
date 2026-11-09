import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class EnvConfig {
  static String _apiUrl = '';
  static String _androidApiUrl = '';

  static Future<void> initialize() async {
    // 1. Check if passed via compile-time --dart-define=API_URL=...
    const compileTimeUrl = String.fromEnvironment('API_URL');
    if (compileTimeUrl.isNotEmpty) {
      _apiUrl = compileTimeUrl;
      return;
    }

    // 2. Otherwise load from external assets/env.json configuration file
    try {
      final jsonString = await rootBundle.loadString('assets/env.json');
      final Map<String, dynamic> config = jsonDecode(jsonString);
      _apiUrl = config['API_URL'] as String? ?? '';
      _androidApiUrl = config['ANDROID_API_URL'] as String? ?? '';
    } catch (_) {
      // Configuration file not loaded
    }
  }

  static String get apiBaseUrl {
    if (defaultTargetPlatform == TargetPlatform.android && !kIsWeb) {
      return _androidApiUrl.isNotEmpty ? _androidApiUrl : _apiUrl;
    }
    return _apiUrl;
  }
}

