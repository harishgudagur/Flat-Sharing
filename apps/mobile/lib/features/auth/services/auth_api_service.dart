import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/user_model.dart';

class AuthApiService {
  final ApiClient _client = ApiClient();
  final TokenStorage _storage = TokenStorage();

  Future<ApiResponse<UserModel>> register({
    String? email,
    String? phoneNumber,
    required String password,
  }) async {
    final body = <String, dynamic>{
      'password': password,
    };
    if (email != null && email.isNotEmpty) body['email'] = email.trim();
    if (phoneNumber != null && phoneNumber.isNotEmpty) body['phoneNumber'] = phoneNumber.trim();

    final response = await _client.post('/auth/register', body: body);

    if (response.success && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user']);
      final tokens = data['tokens'] as Map<String, dynamic>;

      _storage.saveTokens(
        accessToken: tokens['accessToken'],
        refreshToken: tokens['refreshToken'],
        user: user.toJson(),
      );

      return ApiResponse<UserModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: user,
      );
    }

    return ApiResponse<UserModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<UserModel>> login({
    required String identifier,
    required String password,
  }) async {
    final response = await _client.post(
      '/auth/login',
      body: {
        'identifier': identifier.trim(),
        'password': password,
      },
    );

    if (response.success && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user']);
      final tokens = data['tokens'] as Map<String, dynamic>;

      _storage.saveTokens(
        accessToken: tokens['accessToken'],
        refreshToken: tokens['refreshToken'],
        user: user.toJson(),
      );

      return ApiResponse<UserModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: user,
      );
    }

    return ApiResponse<UserModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> sendOtp({
    required String identifier,
    required String purpose,
  }) async {
    final response = await _client.post(
      '/auth/otp/send',
      body: {
        'identifier': identifier.trim(),
        'purpose': purpose,
      },
    );

    if (response.success) {
      return ApiResponse<Map<String, dynamic>>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: response.data as Map<String, dynamic>?,
      );
    }

    return ApiResponse<Map<String, dynamic>>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<UserModel>> verifyOtp({
    required String identifier,
    required String code,
    required String purpose,
  }) async {
    final response = await _client.post(
      '/auth/otp/verify',
      body: {
        'identifier': identifier.trim(),
        'code': code.trim(),
        'purpose': purpose,
      },
    );

    if (response.success && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      UserModel? user;
      if (data['user'] != null) {
        user = UserModel.fromJson(data['user']);
      }
      if (data['tokens'] != null) {
        final tokens = data['tokens'] as Map<String, dynamic>;
        _storage.saveTokens(
          accessToken: tokens['accessToken'],
          refreshToken: tokens['refreshToken'],
          user: user?.toJson(),
        );
      }

      return ApiResponse<UserModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: user,
      );
    }

    return ApiResponse<UserModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<void>> logout() async {
    final response = await _client.post(
      '/auth/logout',
      body: {'refreshToken': _storage.refreshToken},
      requiresAuth: true,
    );

    _storage.clear();

    return ApiResponse<void>(
      success: response.success,
      statusCode: response.statusCode,
      message: response.message,
    );
  }

  Future<ApiResponse<UserModel>> fetchMe() async {
    final response = await _client.get('/auth/me', requiresAuth: true);

    if (response.success && response.data != null) {
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      _storage.saveUser(user.toJson());
      return ApiResponse<UserModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: user,
      );
    }

    return ApiResponse<UserModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }
}

