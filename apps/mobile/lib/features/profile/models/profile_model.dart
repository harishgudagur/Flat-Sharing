import 'lifestyle_preferences_model.dart';

class PhotoModel {
  final String id;
  final String url;
  final int order;
  final bool isPrimary;

  PhotoModel({
    required this.id,
    required this.url,
    this.order = 0,
    this.isPrimary = false,
  });

  factory PhotoModel.fromJson(Map<String, dynamic> json) {
    return PhotoModel(
      id: json['id'] as String? ?? '',
      url: json['url'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      isPrimary: json['isPrimary'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      'order': order,
      'isPrimary': isPrimary,
    };
  }
}

class LocationModel {
  final String id;
  final double? latitude;
  final double? longitude;
  final String cityName;
  final String? areaName;

  LocationModel({
    this.id = '',
    this.latitude,
    this.longitude,
    required this.cityName,
    this.areaName,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      id: json['id'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      cityName: json['cityName'] as String? ?? '',
      areaName: json['areaName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'cityName': cityName,
      'areaName': areaName,
    };
  }
}

class InterestModel {
  final String id;
  final String interestName;
  final String? category;

  InterestModel({
    this.id = '',
    required this.interestName,
    this.category,
  });

  factory InterestModel.fromJson(Map<String, dynamic> json) {
    return InterestModel(
      id: json['id'] as String? ?? '',
      interestName: json['interestName'] as String? ?? '',
      category: json['category'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'interestName': interestName,
      'category': category,
    };
  }
}

class UserProfileModel {
  final String id;
  final String userId;
  final String displayName;
  final DateTime dateOfBirth;
  final String gender;
  final String? bio;
  final String? occupation;
  final String? companyOrCollege;
  final int budgetMin;
  final int budgetMax;
  final String city;
  final String? preferredLocality;
  final DateTime? moveInDate;
  final bool isComplete;
  final LifestylePreferencesModel? lifestyle;
  final List<PhotoModel> photos;
  final LocationModel? location;
  final List<InterestModel> interests;

  UserProfileModel({
    required this.id,
    required this.userId,
    required this.displayName,
    required this.dateOfBirth,
    required this.gender,
    this.bio,
    this.occupation,
    this.companyOrCollege,
    required this.budgetMin,
    required this.budgetMax,
    required this.city,
    this.preferredLocality,
    this.moveInDate,
    this.isComplete = false,
    this.lifestyle,
    this.photos = const [],
    this.location,
    this.interests = const [],
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.tryParse(json['dateOfBirth'].toString()) ?? DateTime(2000)
          : DateTime(2000),
      gender: json['gender'] as String? ?? 'OTHER',
      bio: json['bio'] as String?,
      occupation: json['occupation'] as String?,
      companyOrCollege: json['companyOrCollege'] as String?,
      budgetMin: json['budgetMin'] as int? ?? 0,
      budgetMax: json['budgetMax'] as int? ?? 0,
      city: json['city'] as String? ?? '',
      preferredLocality: json['preferredLocality'] as String?,
      moveInDate: json['moveInDate'] != null
          ? DateTime.tryParse(json['moveInDate'].toString())
          : null,
      isComplete: json['isComplete'] as bool? ?? false,
      lifestyle: json['lifestyle'] != null
          ? LifestylePreferencesModel.fromJson(
              json['lifestyle'] as Map<String, dynamic>)
          : null,
      photos: (json['photos'] as List<dynamic>?)
              ?.map((p) => PhotoModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      location: json['location'] != null
          ? LocationModel.fromJson(json['location'] as Map<String, dynamic>)
          : null,
      interests: (json['interests'] as List<dynamic>?)
              ?.map((i) => InterestModel.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toUpsertJson() {
    return {
      'displayName': displayName,
      'dateOfBirth': dateOfBirth.toIso8601String().split('T')[0],
      'gender': gender,
      'bio': bio,
      'occupation': occupation,
      'companyOrCollege': companyOrCollege,
      'budgetMin': budgetMin,
      'budgetMax': budgetMax,
      'city': city,
      'preferredLocality': preferredLocality,
      if (moveInDate != null)
        'moveInDate': moveInDate!.toIso8601String().split('T')[0],
    };
  }

  int get age {
    final now = DateTime.now();
    int calculatedAge = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      calculatedAge--;
    }
    return calculatedAge;
  }
}

