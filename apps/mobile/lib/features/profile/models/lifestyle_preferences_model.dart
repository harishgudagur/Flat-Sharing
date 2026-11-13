class LifestylePreferencesModel {
  final String id;
  final String profileId;
  final String sleepSchedule;
  final String cleanliness;
  final String socialPreference;
  final String foodPreference;
  final String workSchedule;
  final String smokingPreference;
  final String drinkingPreference;
  final String petPreference;
  final String privacyPreference;
  final List<String> nonNegotiables;

  LifestylePreferencesModel({
    this.id = '',
    this.profileId = '',
    this.sleepSchedule = 'FLEXIBLE',
    this.cleanliness = 'MODERATE',
    this.socialPreference = 'AMBIVERT',
    this.foodPreference = 'VEGETARIAN',
    this.workSchedule = 'HYBRID',
    this.smokingPreference = 'NEVER',
    this.drinkingPreference = 'NEVER',
    this.petPreference = 'NO_PETS',
    this.privacyPreference = 'MODERATE',
    this.nonNegotiables = const [],
  });

  factory LifestylePreferencesModel.fromJson(Map<String, dynamic> json) {
    return LifestylePreferencesModel(
      id: json['id'] as String? ?? '',
      profileId: json['profileId'] as String? ?? '',
      sleepSchedule: json['sleepSchedule'] as String? ?? 'FLEXIBLE',
      cleanliness: json['cleanliness'] as String? ?? 'MODERATE',
      socialPreference: json['socialPreference'] as String? ?? 'AMBIVERT',
      foodPreference: json['foodPreference'] as String? ?? 'VEGETARIAN',
      workSchedule: json['workSchedule'] as String? ?? 'HYBRID',
      smokingPreference: json['smokingPreference'] as String? ?? 'NEVER',
      drinkingPreference: json['drinkingPreference'] as String? ?? 'NEVER',
      petPreference: json['petPreference'] as String? ?? 'NO_PETS',
      privacyPreference: json['privacyPreference'] as String? ?? 'MODERATE',
      nonNegotiables: (json['nonNegotiables'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sleepSchedule': sleepSchedule,
      'cleanliness': cleanliness,
      'socialPreference': socialPreference,
      'foodPreference': foodPreference,
      'workSchedule': workSchedule,
      'smokingPreference': smokingPreference,
      'drinkingPreference': drinkingPreference,
      'petPreference': petPreference,
      'privacyPreference': privacyPreference,
      'nonNegotiables': nonNegotiables,
    };
  }

  LifestylePreferencesModel copyWith({
    String? sleepSchedule,
    String? cleanliness,
    String? socialPreference,
    String? foodPreference,
    String? workSchedule,
    String? smokingPreference,
    String? drinkingPreference,
    String? petPreference,
    String? privacyPreference,
    List<String>? nonNegotiables,
  }) {
    return LifestylePreferencesModel(
      id: id,
      profileId: profileId,
      sleepSchedule: sleepSchedule ?? this.sleepSchedule,
      cleanliness: cleanliness ?? this.cleanliness,
      socialPreference: socialPreference ?? this.socialPreference,
      foodPreference: foodPreference ?? this.foodPreference,
      workSchedule: workSchedule ?? this.workSchedule,
      smokingPreference: smokingPreference ?? this.smokingPreference,
      drinkingPreference: drinkingPreference ?? this.drinkingPreference,
      petPreference: petPreference ?? this.petPreference,
      privacyPreference: privacyPreference ?? this.privacyPreference,
      nonNegotiables: nonNegotiables ?? this.nonNegotiables,
    );
  }
}

