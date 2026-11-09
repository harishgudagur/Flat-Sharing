import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';
import '../storage/token_storage.dart';

class ApiResponse<T> {
  final bool success;
  final int statusCode;
  final String message;
  final T? data;
  final String? error;

  ApiResponse({
    required this.success,
    required this.statusCode,
    required this.message,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromDataJson,
  ) {
    return ApiResponse<T>(
      success: json['success'] as bool? ?? false,
      statusCode: json['statusCode'] as int? ?? 200,
      message: json['message'] as String? ?? '',
      data: json['data'] != null && fromDataJson != null
          ? fromDataJson(json['data'])
          : json['data'] as T?,
      error: json['error'] as String?,
    );
  }
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final TokenStorage _tokenStorage = TokenStorage();

  // Read dynamically from EnvConfig (loaded from assets/env.json or --dart-define)
  String get baseUrl => EnvConfig.apiBaseUrl;

  Future<ApiResponse<dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (requiresAuth && _tokenStorage.accessToken != null) {
        headers['Authorization'] = 'Bearer ${_tokenStorage.accessToken}';
      }

      final response = await http.post(
        uri,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );

      final Map<String, dynamic> jsonResponse = jsonDecode(response.body);

      // Handle 401 token refresh if required
      if (response.statusCode == 401 &&
          requiresAuth &&
          _tokenStorage.refreshToken != null) {
        final refreshed = await _attemptRefreshToken();
        if (refreshed) {
          // Retry original request once
          return post(endpoint, body: body, requiresAuth: requiresAuth);
        }
      }

      return ApiResponse.fromJson(jsonResponse, null);
    } catch (e) {
      return ApiResponse(
        success: false,
        statusCode: 500,
        message: 'Network connection error: ${e.toString()}',
        error: 'NetworkError',
      );
    }
  }

  Future<ApiResponse<dynamic>> get(
    String endpoint, {
    bool requiresAuth = true,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = <String, String>{
        'Accept': 'application/json',
      };

      if (requiresAuth && _tokenStorage.accessToken != null) {
        headers['Authorization'] = 'Bearer ${_tokenStorage.accessToken}';
      }

      final response = await http.get(uri, headers: headers);
      final Map<String, dynamic> jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 401 &&
          requiresAuth &&
          _tokenStorage.refreshToken != null) {
        final refreshed = await _attemptRefreshToken();
        if (refreshed) {
          return get(endpoint, requiresAuth: requiresAuth);
        }
      }

      return ApiResponse.fromJson(jsonResponse, null);
    } catch (e) {
      return ApiResponse(
        success: false,
        statusCode: 500,
        message: 'Network connection error: ${e.toString()}',
        error: 'NetworkError',
      );
    }
  }

  Future<bool> _attemptRefreshToken() async {
    final currentRefreshToken = _tokenStorage.refreshToken;
    if (currentRefreshToken == null) return false;

    try {
      final uri = Uri.parse('$baseUrl/auth/refresh');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': currentRefreshToken}),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final data = jsonResponse['data'];
        if (data != null && data['accessToken'] != null) {
          _tokenStorage.saveTokens(
            accessToken: data['accessToken'],
            refreshToken: data['refreshToken'],
          );
          return true;
        }
      }
    } catch (_) {}

    _tokenStorage.clear();
    return false;
  }
}
