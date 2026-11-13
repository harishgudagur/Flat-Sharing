import '../../../core/network/api_client.dart';
import '../models/profile_model.dart';
import '../models/lifestyle_preferences_model.dart';

class ProfileApiService {
  final ApiClient _client = ApiClient();

  Future<ApiResponse<UserProfileModel?>> getMyProfile() async {
    final response = await _client.get('/profiles/me', requiresAuth: true);
    if (response.success && response.data != null) {
      return ApiResponse<UserProfileModel?>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: UserProfileModel.fromJson(response.data as Map<String, dynamic>),
      );
    }
    return ApiResponse<UserProfileModel?>(
      success: response.success,
      statusCode: response.statusCode,
      message: response.message,
      data: null,
      error: response.error,
    );
  }

  Future<ApiResponse<UserProfileModel>> upsertProfile(
      Map<String, dynamic> data) async {
    final response =
        await _client.put('/profiles/me', body: data, requiresAuth: true);
    if (response.success && response.data != null) {
      return ApiResponse<UserProfileModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: UserProfileModel.fromJson(response.data as Map<String, dynamic>),
      );
    }
    return ApiResponse<UserProfileModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<LifestylePreferencesModel>> updateLifestyle(
      Map<String, dynamic> data) async {
    final response = await _client.put('/profiles/me/lifestyle',
        body: data, requiresAuth: true);
    if (response.success && response.data != null) {
      final lifestyleJson = response.data['lifestyle'] as Map<String, dynamic>?;
      return ApiResponse<LifestylePreferencesModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: lifestyleJson != null
            ? LifestylePreferencesModel.fromJson(lifestyleJson)
            : LifestylePreferencesModel(),
      );
    }
    return ApiResponse<LifestylePreferencesModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<LocationModel>> updateLocation(
      Map<String, dynamic> data) async {
    final response = await _client.put('/profiles/me/location',
        body: data, requiresAuth: true);
    if (response.success && response.data != null) {
      return ApiResponse<LocationModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: LocationModel.fromJson(response.data as Map<String, dynamic>),
      );
    }
    return ApiResponse<LocationModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<PhotoModel>> addPhoto(String url,
      {bool isPrimary = false}) async {
    final response = await _client.post(
      '/profiles/me/photos',
      body: {'url': url, 'isPrimary': isPrimary},
      requiresAuth: true,
    );
    if (response.success && response.data != null) {
      return ApiResponse<PhotoModel>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: PhotoModel.fromJson(response.data as Map<String, dynamic>),
      );
    }
    return ApiResponse<PhotoModel>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }

  Future<ApiResponse<dynamic>> deletePhoto(String photoId) async {
    return await _client.delete('/profiles/me/photos/$photoId',
        requiresAuth: true);
  }

  Future<ApiResponse<List<InterestModel>>> setInterests(
      List<Map<String, String>> interests) async {
    final response = await _client.put(
      '/profiles/me/interests',
      body: {'interests': interests},
      requiresAuth: true,
    );
    if (response.success && response.data != null) {
      final list = (response.data as List<dynamic>)
          .map((item) => InterestModel.fromJson(item as Map<String, dynamic>))
          .toList();
      return ApiResponse<List<InterestModel>>(
        success: true,
        statusCode: response.statusCode,
        message: response.message,
        data: list,
      );
    }
    return ApiResponse<List<InterestModel>>(
      success: false,
      statusCode: response.statusCode,
      message: response.message,
      error: response.error,
    );
  }
}

